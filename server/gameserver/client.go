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
	Id   uuid.UUID
	hub  *GameHub
	conn *websocket.Conn
	send chan []byte
	Room *GameRoom
}

func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}

		var event Event
		if err := json.Unmarshal(message, &event); err != nil {
			log.Printf("Error reading JSON: %v", err)
			continue
		}

		switch event.Type {
		case "create_game":
			code := c.hub.CreateUniqueRoom()
			room := c.hub.GetRoom(code)

			c.Room = room
			room.Register <- c

			responsePayload := GameCreatedPayload{GameCode: code}
			responseBytes, _ := json.Marshal(responsePayload)
			responseEvent := Event{Type: "game_created", Payload: responseBytes}
			finalResponse, _ := json.Marshal(responseEvent)
			c.send <- finalResponse

		case "join_game":
			var joinData JoinGamePayload
			json.Unmarshal(event.Payload, &joinData)

			room := c.hub.GetRoom(joinData.GameCode)

			if room != nil {
				c.Room = room

				room.Register <- c

				successEvent := Event{
					Type:    "joined_game",
					Payload: []byte(`{"message": "Du är gick med i spelet!"}`),
				}

				finalResponse, _ := json.Marshal(successEvent)
				c.send <- finalResponse
			} else {
				errorEvent := Event{
					Type:    "error",
					Payload: []byte(`{"message": "Rummet finns inte."}`),
				}
				finalResponse, _ := json.Marshal(errorEvent)
				c.send <- finalResponse
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
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("Upgrade error:", err)
		return
	}

	client := &Client{
		Id:   uuid.New(),
		hub:  hub,
		conn: conn,
		send: make(chan []byte, 256),
	}

	client.hub.register <- client
	go client.writePump()
	go client.readPump()

	client.send <- []byte(`{"type": "connection", "payload": "Välkommen till WordSmash-servern!"}`)
}
