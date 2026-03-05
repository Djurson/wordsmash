package gameserver

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,

	// TODO: Change to specific
	CheckOrigin: func(r *http.Request) bool { return true },
}

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
		case "create_game":
			// Get & save the username sent by the frontend
			var createData CreateGamePayload
			if err := json.Unmarshal(event.Payload, &createData); err != nil {
				log.Printf("Error when reading create_game payload: %v", err)
				continue
			}
			c.Username = createData.Username

			// Create the room and register the client to the room
			code := c.hub.CreateUniqueRoom()
			room := c.hub.GetRoom(code)
			c.Room = room
			room.Register <- c

			// Send a response to the client with the room code
			responsePayload := GameCreatedPayload{GameCode: code}
			c.send <- PrepareEvent(GameCreatedEvent, responsePayload)

		case "join_game":
			// Get & save the username sent by the frontend, and get the room code
			var joinData JoinGamePayload
			if err := json.Unmarshal(event.Payload, &joinData); err != nil {
				log.Printf("Kunde inte läsa join_game payload: %v", err)
				continue
			}
			c.Username = joinData.Username

			// Find the room
			room := c.hub.GetRoom(joinData.GameCode)
			if room != nil {
				// Client joins the room
				c.Room = room
				room.Register <- c

				c.send <- PrepareEvent(JoinedGameEvent, map[string]string{"message": "Du gick med i spelet!"})
			} else {
				// Send error if the room doesn't exists
				c.send <- PrepareEvent(ErrorEvent, map[string]string{"message": "Rummet finns inte."})
			}

		case "submit_turn":
			if c.Room != nil {
				c.Room.ProcessMove <- event.Payload
			} else {
				//! Player is not in a room
			}
		}
	}
}

func (c *Client) writePump() {
	defer func() {
		c.conn.Close()
	}()

	for message := range c.send {
		w, err := c.conn.NextWriter(websocket.TextMessage)
		if err != nil {
			return
		}

		w.Write(message)

		if err := w.Close(); err != nil {
			return
		}
	}

	// The gamehub closed the channel
	c.conn.WriteMessage(websocket.CloseMessage, []byte{})
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

	// Register the client to the hub
	client.hub.register <- client
	go client.writePump()
	go client.readPump()

	client.send <- PrepareEvent(ConnectedToServerEvent, map[string]string{"message": "Välkommen till WordSmash!"})
}
