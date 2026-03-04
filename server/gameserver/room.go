package gameserver

import (
	"encoding/json"

	"github.com/google/uuid"
)

type GameRoom struct {
	ID          string
	Clients     map[*Client]bool
	State       *GameState
	Broadcast   chan []byte
	Register    chan *Client
	Unregister  chan *Client
	ProcessMove chan []byte
}

type User struct {
	Username string    `json:"username"`
	UserId   uuid.UUID `json:"userId"`
}

func NewRoom(id string) *GameRoom {
	return &GameRoom{
		ID:          id,
		Clients:     make(map[*Client]bool),
		State:       NewGameState(),
		Broadcast:   make(chan []byte),
		Register:    make(chan *Client),
		Unregister:  make(chan *Client),
		ProcessMove: make(chan []byte),
	}
}

func (r *GameRoom) Run() {
	for {
		select {
		case client := <-r.Register:
			r.Clients[client] = true

		case client := <-r.Unregister:
			delete(r.Clients, client)
			if len(r.Clients) == 0 {
				client.hub.DeleteRoom(r.ID)

				return
			}

		case message := <-r.Broadcast:
			for client := range r.Clients {
				client.send <- message
			}

		case payload := <-r.ProcessMove:
			var newTiles []PlacedTile
			json.Unmarshal(payload, &newTiles)

			// TODO: Implement checking from what the client sends
			// TODO: Call hub.dictionary.isvalid
			// TODO: Implement bombs

			//* For now trust the client
			for _, tile := range newTiles {
				tile.State = "placed"
				r.State.Board[getTileKey(tile.X, tile.Y)] = tile
			}

			boardBytes, _ := json.Marshal(r.State.Board)
			updateEvent := Event{
				Type:    "board_update",
				Payload: boardBytes,
			}
			finalMessage, _ := json.Marshal(updateEvent)

			for client := range r.Clients {
				client.send <- finalMessage
			}
		}
	}
}
