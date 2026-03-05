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
	Team     string    `json:"team"`
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

		// A client joins the room
		case client := <-r.Register:
			// Add the client to the map
			r.Clients[client] = true

			// Assign the client to a team
			countA := len(r.State.Teams["a"].Players)
			countB := len(r.State.Teams["b"].Players)
			assignedTeam := "a"
			if countB < countA {
				assignedTeam = "b"
			}
			client.Team = assignedTeam

			r.State.Teams[assignedTeam].Players[client.Id] = PlayerInfo{
				ID:   client.Id,
				Name: client.Username,
			}

			// Send out that the a new client has joined
			finalMessage := PrepareEvent(LobbyUpdateEvent, r.State)
			for c := range r.Clients {
				c.send <- finalMessage
			}

		// A client leaves the room
		case client := <-r.Unregister:
			delete(r.Clients, client)

			// Remove the client from the teams
			if client.Team != "" {
				delete(r.State.Teams[client.Team].Players, client.Id)
			}

			// Delete the room if there are no ther clients
			if len(r.Clients) == 0 {
				client.hub.DeleteRoom(r.ID)
				return
			}

			finalMessage := PrepareEvent(LobbyUpdateEvent, r.State)

			for c := range r.Clients {
				c.send <- finalMessage
			}

		case message := <-r.Broadcast:
			for client := range r.Clients {
				client.send <- message
			}

		// A client has sent a new move
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

			finalMessage := PrepareEvent(BoardUpdateEvent, r.State.Board)

			for client := range r.Clients {
				client.send <- finalMessage
			}
		}
	}
}
