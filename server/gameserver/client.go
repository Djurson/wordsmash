package gameserver

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,

	CheckOrigin: func(r *http.Request) bool {

		origin := r.Header.Get("Origin")

		frontend := os.Getenv("FRONTEND_URL")
		preview := os.Getenv("FRONTEND_GIT_MAIN_URL")

		log.Println("WS origin:", origin)

		if origin == frontend || origin == preview {
			return true
		}

		if origin == "http://localhost:3000" {
			return true
		}

		return false
	},
}

const (
	pongWait      = 60 * time.Second
	pingIntervall = 50 * time.Second
)

const (
	SOCKETREADLIMIT      int64 = 1024
	MAXMESSAGESPERSECOND int   = 30
	MAXMESSAGEWARNINGS   int   = 3
)

type Client struct {
	Id       uuid.UUID
	Username string
	hub      *GameHub
	conn     *websocket.Conn
	send     chan []byte
	Room     *GameRoom
	Team     string
}

// readPump pumps messages from the websocket connection to the hub.
// It sets up read deadlines, handles rate limiting to prevent spam,
// unmarshals incoming JSON events, and dispatches them to the appropriate room or hub channel.
func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	if err := c.conn.SetReadDeadline(time.Now().Add(pongWait)); err != nil {
		fmt.Println(err)
		return
	}

	c.conn.SetReadLimit(SOCKETREADLIMIT)
	c.conn.SetPongHandler(c.pongHandler)

	messageCount := 0
	messageWarnings := 0
	windowStart := time.Now()

	for {
		_, message, err := c.conn.ReadMessage()

		// If the websocket crashes
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}

		// SOME IMPLEMENTAION OF RATE LIMITING ?
		now := time.Now()
		if now.Sub(windowStart) >= time.Second {
			// Reset time window
			messageCount = 0
			windowStart = now
		}

		messageCount++
		if messageCount > MAXMESSAGESPERSECOND {
			messageWarnings++
			messageCount = 0

			log.Printf("Warning: Client %s sent packages too quickly!", c.Id)

			if messageWarnings >= MAXMESSAGEWARNINGS {
				break
			}
			continue
		}

		// Read what type of event
		var event Event
		if err := json.Unmarshal(message, &event); err != nil {
			log.Printf("Error reading JSON: %v", err)
			continue
		}

		// Switch case for each event
		switch event.Type {
		case CreateGameEvent:
			// Get & save the username sent by the frontend & validate gamesettings
			var createData CreateGamePayload
			if err := json.Unmarshal(event.Payload, &createData); err != nil {
				log.Printf("Error when reading create_game payload: %v", err)
				continue
			}
			username := strings.TrimSpace(createData.Username)
			if username == "" {
				c.send <- PrepareEvent(ErrorEvent, map[string]string{"message": "Användarnamnet får inte vara tomt."})
				continue
			}
			createData = ValidateCreateGameDataSetting(createData)

			c.Username = username

			// Create the room and register the client to the room
			code := c.hub.CreateUniqueRoom()
			room := c.hub.GetRoom(code)

			// Set host
			room.State.Host = c.Id

			c.Room = room
			room.Register <- c
			room.State.Settings = createData.Settings

			// Send a response to the client with the room code
			user := User{Username: c.Username, Team: c.Team, UserId: c.Id}
			c.send <- PrepareEvent(GameCreatedEvent, CreatedJoinGameResponse{User: user, GameState: room.State.ToClientState(c.Team), Message: "Du skapade ett nytt spel!"})

		case JoinGameEvent:
			// Get & save the username sent by the frontend, and get the room code
			var joinData JoinGamePayload
			if err := json.Unmarshal(event.Payload, &joinData); err != nil {
				log.Printf("Error reading join_game payload: %v", err)
				continue
			}

			username := strings.TrimSpace(joinData.Username)
			if username == "" {
				c.send <- PrepareEvent(ErrorEvent, map[string]string{"message": "Användarnamnet får inte vara tomt."})
				continue
			}
			c.Username = username

			// Find the room
			room := c.hub.GetRoom(joinData.GameCode)
			if room != nil {
				// Client joins the room
				c.Room = room
				room.Register <- c
			} else {
				// Send error if the room doesn't exists
				c.send <- PrepareEvent(ErrorEvent, map[string]string{"message": "Rummet finns inte."})
			}

		case UpdateSettingsEvent:
			if c.Room != nil {
				if c.Id == c.Room.State.Host {
					c.Room.UpdateSettings <- event.Payload
				} else {
					c.send <- PrepareEvent(ErrorEvent, map[string]string{"message": "Bara spelledaren kan ändra inställningar!"})
				}
			}

		case LeaveRoomEvent:
			if c.Room != nil {
				room := c.Room

				c.Room = nil

				room.Unregister <- c

				c.send <- PrepareEvent(LeftRoomEvent, map[string]string{"message": "Du lämnade rummet"})
			}

		case UpdateUsernameEvent:
			var updateData UpdateUsernamePayload
			if err := json.Unmarshal(event.Payload, &updateData); err != nil {
				log.Printf("Error reading update_username payload: %v", err)
				continue
			}

			c.Username = updateData.Username

			if c.Room != nil {
				c.Room.UpdateUsername <- c
			} else {
				c.send <- PrepareEvent(ConnectedToServerEvent, map[string]string{"message": "Användarnamn uppdaterat!"})
			}

		case StartGameEvent:
			if c.Room != nil {
				c.Room.StartGame <- c
			}

		case LockLetterEvent:
			var payload LockLetterPayload
			if err := json.Unmarshal(event.Payload, &payload); err != nil {
				log.Printf("Error reading lock_letter payload: %v", err)
				continue
			}

			if c.Room != nil {
				c.Room.LockLetter <- &LockLetterAction{
					Client:    c,
					LetterId:  payload.LetterId,
					Placement: payload.Placement,
				}
			}

		case UnlockLetterEvent:
			if c.Room != nil {
				c.Room.UnlockLetter <- c
			}

		case SubmitTurnEvent:
			if c.Room == nil {
				continue
			}

			var payload SubmitTurnPayload
			if err := json.Unmarshal(event.Payload, &payload); err != nil {
				log.Printf("Error reading lock_letter payload: %v", err)
				continue
			}

			for key := range payload.NewTiles {
				tile := payload.NewTiles[key]
				tile.PlacedBy = c.Id
				payload.NewTiles[key] = tile
			}

			c.Room.ProcessMove <- &SubmitTurnAction{Client: c, NewTiles: payload.NewTiles}

		case UnlockSingleLetterEvent:
			var payload UnlockSingleLetterPayload
			json.Unmarshal(event.Payload, &payload)
			c.hub.Rooms[c.Room.ID].UnlockSingleLetter <- &UnlockSingleLetterAction{
				Client:   c,
				LetterId: payload.LetterId,
				TileKey:  payload.TileKey,
			}

		case SubmitBombEvent:
			if c.Room == nil || !c.Room.State.Settings.EnableSpecials {
				continue
			}

			var payload SubmitSpecialEffectPayload
			if err := json.Unmarshal(event.Payload, &payload); err != nil {
				log.Printf("Error reading submit_bomb payload: %v", err)
				continue
			}

			c.Room.UpdateSpecialTiles <- &SubmitSpecialEffectAction{X: payload.X, Y: payload.Y, Client: c, Type: BombEffect}

		case SubmitRoadblockEvent:
			if c.Room == nil || !c.Room.State.Settings.EnableSpecials {
				continue
			}

			var payload SubmitSpecialEffectPayload
			if err := json.Unmarshal(event.Payload, &payload); err != nil {
				log.Printf("Error reading submit_bomb payload: %v", err)
				continue
			}

			c.Room.UpdateSpecialTiles <- &SubmitSpecialEffectAction{X: payload.X, Y: payload.Y, Client: c, Type: RoadblockEffect}

			// TODO: Handle trade in tiles case

			// TODO: Handle buy power-up case
		}
	}
}

// writePump pumps messages from the hub to the websocket connection.
// It listens on the client's send channel and writes the messages to the socket,
// while also handling periodic ping messages to keep the connection alive.
func (c *Client) writePump() {
	ticker := time.NewTicker(pingIntervall)

	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			if !ok {
				// The gamehub closed the channel
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}

			w.Write(message)

			if err := w.Close(); err != nil {
				return
			}
		case <-ticker.C:
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// ServeWs handles websocket requests from the peer.
// It upgrades the HTTP connection, initializes a new Client, registers it with the hub,
// and starts the read and write pumps in separate goroutines.
func ServeWs(hub *GameHub, w http.ResponseWriter, r *http.Request) {
	// Upgrade the connection
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("Upgrade error:", err)
		return
	}

	// Create the client
	client := &Client{
		Id:   uuid.New(),
		hub:  hub,
		conn: conn,
		send: make(chan []byte, 256),
	}

	// Registers the client to the hub
	client.hub.register <- client
	go client.writePump()
	go client.readPump()

	client.send <- PrepareEvent(ConnectedToServerEvent, map[string]string{"message": "Välkommen till Word Smash!"})
}

// pongHandler handles websocket pong messages by extending the read deadline,
// ensuring the connection is kept alive.
func (c *Client) pongHandler(pongMessage string) error {
	return c.conn.SetReadDeadline(time.Now().Add(pongWait))
}

// ValidateCreateGameDataSetting ensures the game timer settings within a CreateGamePayload
// stay within the minimum and maximum allowed minutes. It returns the validated payload.
func ValidateCreateGameDataSetting(data CreateGamePayload) CreateGamePayload {
	if data.Settings.TimerMinutes < MINTIMERMINUTES {
		data.Settings.TimerMinutes = MINTIMERMINUTES
	} else if data.Settings.TimerMinutes > MAXTIMERMINUTES {
		data.Settings.TimerMinutes = MAXTIMERMINUTES
	}

	if data.Settings.EnableSpecials {
		if data.Settings.RoadblockDuration < MINROADBLOCKDURATION {
			data.Settings.RoadblockDuration = MINROADBLOCKDURATION
		} else if data.Settings.RoadblockDuration > MAXROADBLOCKDURATION {
			data.Settings.RoadblockDuration = MAXROADBLOCKDURATION
		} else if data.Settings.RoadblockDuration%ROADBLOCKDURATIONSTEPSIZE != 0 {
			data.Settings.RoadblockDuration = DEFAULTROADBLOCKDURATION
		}
	}

	return data
}
