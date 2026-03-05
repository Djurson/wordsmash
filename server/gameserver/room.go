package gameserver

import (
	"encoding/json"

	"github.com/google/uuid"
)

type GameRoom struct {
	ID             string
	Clients        map[*Client]bool
	State          *GameState
	Broadcast      chan []byte
	Register       chan *Client
	Unregister     chan *Client
	ProcessMove    chan []byte
	UpdateSettings chan []byte
	UpdateUsername chan *Client
	StartGame      chan *Client
}

type User struct {
	Username string    `json:"username"`
	UserId   uuid.UUID `json:"userId"`
	Team     string    `json:"team"`
}

func NewRoom(id string) *GameRoom {
	return &GameRoom{
		ID:             id,
		Clients:        make(map[*Client]bool),
		State:          NewGameState(id),
		Broadcast:      make(chan []byte),
		Register:       make(chan *Client),
		Unregister:     make(chan *Client),
		ProcessMove:    make(chan []byte),
		UpdateSettings: make(chan []byte),
		UpdateUsername: make(chan *Client),
		StartGame:      make(chan *Client),
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

			r.State.Teams[assignedTeam].Players[client.Id] = &User{
				UserId:   client.Id,
				Username: client.Username,
				Team:     assignedTeam,
			}

			// Send out that the a new client has joined
			finalMessage := PrepareEvent(LobbyUpdateEvent, r.State)
			for c := range r.Clients {
				c.send <- finalMessage
			}

		// A client leaves the room
		case client := <-r.Unregister:
			delete(r.Clients, client)

			if client.Team != "" {
				delete(r.State.Teams[client.Team].Players, client.Id)
				client.Team = ""
			}

			// Delete the room if there are no other clients
			if len(r.Clients) == 0 {
				client.hub.DeleteRoom(r.ID)
				return
			}

			if r.State.Host == client.Id {
				for remainingClient := range r.Clients {
					r.State.Host = remainingClient.Id
					break
				}
			}

			finalMessage := PrepareEvent(LobbyUpdateEvent, r.State)
			for c := range r.Clients {
				c.send <- finalMessage
			}

		case client := <-r.UpdateUsername:
			if client.Team != "" {
				if player, exists := r.State.Teams[client.Team].Players[client.Id]; exists {
					player.Username = client.Username
				}
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

		case payload := <-r.UpdateSettings:
			var newSettings GameSettings
			json.Unmarshal(payload, &newSettings)

			// Update the rooms settings
			r.State.Settings = newSettings

			finalMessage := PrepareEvent(SettingsUpdatedEvent, newSettings)

			for client := range r.Clients {
				client.send <- finalMessage
			}

		// Start game
		case hostClient := <-r.StartGame:
			if r.State.Host != hostClient.Id {
				hostClient.send <- PrepareEvent(ErrorEvent, map[string]string{"message": "Bara spelledaren kan starta spelet."})
				continue
			}

			r.State.PreStartGame(hostClient.hub)

			finalMessage := PrepareEvent(GameStartedEvent, r.State)
			for c := range r.Clients {
				c.send <- finalMessage
			}
		}
	}
}
