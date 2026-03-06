package gameserver

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,

	// TODO: Change to specific
	CheckOrigin: func(r *http.Request) bool { return true },
}

var (
	pongWait      = 10 * time.Second
	pingIntervall = (pongWait * 9) / 10
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

func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	if err := c.conn.SetReadDeadline(time.Now().Add(pongWait)); err != nil {
		fmt.Println(err)
		return
	}

	c.conn.SetReadLimit(256)
	c.conn.SetPongHandler(c.pongHandler)

	for {
		_, message, err := c.conn.ReadMessage()

		// If the websocket crashes
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
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
			// Get & save the username sent by the frontend
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
			c.send <- PrepareEvent(GameCreatedEvent, CreatedJoinGameResponse{User: user, GameState: *room.State, Message: "Du skapade ett nytt spel!"})

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

				userInfo := User{Username: c.Username, Team: c.Team, UserId: c.Id}
				c.send <- PrepareEvent(JoinedGameEvent, CreatedJoinGameResponse{User: userInfo, GameState: *room.State, Message: "Du gick med i spelet!"})
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

		case SubmitTurnEvent:
			if c.Room != nil {
				c.Room.ProcessMove <- event.Payload
			}
		}
	}
}

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

	client.send <- PrepareEvent(ConnectedToServerEvent, map[string]string{"message": "Välkommen till WordSmash!"})
}

func (c *Client) pongHandler(pongMessage string) error {
	return c.conn.SetReadDeadline(time.Now().Add(pongWait))
}
