package gameserver

import (
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
)

type LockLetterAction struct {
	Client    *Client
	LetterId  uuid.UUID
	Placement map[string]PlacedTile
}

type GameRoom struct {
	ID             string
	Clients        map[*Client]bool
	State          *ServerGameState
	Broadcast      chan []byte
	Register       chan *Client
	Unregister     chan *Client
	ProcessMove    chan []byte
	UpdateSettings chan []byte
	UpdateUsername chan *Client
	StartGame      chan *Client
	LockLetter     chan LockLetterAction
	UnlockLetter   chan *Client
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
		LockLetter:     make(chan LockLetterAction),
		UnlockLetter:   make(chan *Client),
	}
}

func (r *GameRoom) Run() {
	for {
		select {

		// A client joins the room
		case client := <-r.Register:
			if r.State.GameStarted {
				client.send <- PrepareEvent(ErrorEvent, map[string]string{"message": "Spelet har redan börjat, kan inte ansluta."})
				continue
			}

			// Add the client to the map
			r.Clients[client] = true

			// Count number of players in each team
			countA := 0
			countB := 0
			for _, p := range r.State.Players {
				if p.Team == "a" {
					countA++
				} else {
					countB++
				}
			}

			assignedTeam := "a"
			if countB < countA {
				assignedTeam = "b"
			}
			client.Team = assignedTeam

			r.State.Players[client.Id] = &User{
				UserId:   client.Id,
				Username: client.Username,
				Team:     assignedTeam,
			}

			// Send out that the a new client has joined
			totalScore := 0

			for _, team := range r.State.Teams {
				totalScore += team.Score
			}

			for c := range r.Clients {
				c.send <- PrepareEvent(LobbyUpdateEvent, r.State.ToClientState(c.Team))
			}

		// A client leaves the room
		case client := <-r.Unregister:
			delete(r.Clients, client)

			// Remove ghost locks
			if client.Team != "" {
				teamLetters := r.State.Teams[client.Team].Letters
				lettersChanged := false
				for id, letter := range teamLetters {
					if letter.IsLocked && letter.LockedBy == client.Id {
						letter.IsLocked = false
						letter.LockedBy = uuid.Nil
						teamLetters[id] = letter
						lettersChanged = true
					}
				}
				if lettersChanged {
					r.State.Teams[client.Team].Letters = teamLetters
					finalMessage := PrepareEvent(UpdatedTeamLetterEvent, UpdatedTeamLettersResponse{TeamLetters: teamLetters})
					for c := range r.Clients {
						if c.Team == client.Team {
							c.send <- finalMessage
						}
					}
				}

				delete(r.State.Players, client.Id)
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

			if r.State.GameStarted {
				message := PrepareEvent(ErrorEvent, map[string]string{"message": fmt.Sprintf("%s lämnade spelet", client.Username)})
				for c := range r.Clients {
					c.send <- message
				}
				continue
			}

			for c := range r.Clients {
				c.send <- PrepareEvent(LobbyUpdateEvent, r.State.ToClientState(c.Team))
			}

		case client := <-r.UpdateUsername:
			if client.Team != "" {
				if player, exists := r.State.Players[client.Id]; exists {
					player.Username = client.Username
				}
			}

			for c := range r.Clients {
				c.send <- PrepareEvent(LobbyUpdateEvent, r.State.ToClientState(c.Team))
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
			// TODO: Clear Placeholders from client entries
			// TODO: Call hub.dictionary.isvalid
			// TODO: Implement bombs

			//* For now trust the client
			for _, tile := range newTiles {
				tile.State = TileStatePlaced
				r.State.Board[getTileKey(tile.X, tile.Y)] = tile
			}

			// Skicka BoardUpdate som vanligt
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

			for c := range r.Clients {
				c.send <- PrepareEvent(GameStartedEvent, r.State.ToClientState(c.Team))
			}

		case action := <-r.LockLetter:
			client := action.Client
			letterID := action.LetterId

			if client.Team == "" {
				continue
			}

			teamLetters := r.State.Teams[client.Team].Letters

			if _, exists := teamLetters[letterID]; !exists {
				continue
			}

			letter := teamLetters[letterID]

			if letter.IsLocked {
				continue
			}

			letter.IsLocked = true
			letter.LockedBy = client.Id
			teamLetters[letterID] = letter
			r.State.Teams[client.Team].Letters = teamLetters

			for key, tile := range action.Placement {
				tile.State = TileStatePlaceholder
				tile.PlacedBy = client.Id.String()
				r.State.Teams[client.Team].Placeholders[key] = tile
			}

			finalMessage := PrepareEvent(UpdatedTeamLetterEvent, UpdatedTeamLettersResponse{
				TeamLetters:  teamLetters,
				Placeholders: r.State.Teams[client.Team].Placeholders,
			})

			for c := range r.Clients {
				if c.Team == client.Team {
					c.send <- finalMessage
				}
			}

		case client := <-r.UnlockLetter:
			teamLetters := r.State.Teams[client.Team].Letters
			changed := false

			for id, letter := range teamLetters {
				if letter.IsLocked && letter.LockedBy == client.Id {
					letter.IsLocked = false
					letter.LockedBy = uuid.Nil
					teamLetters[id] = letter
					changed = true
				}
			}

			placeholders := r.State.Teams[client.Team].Placeholders
			for key, tile := range placeholders {
				if tile.PlacedBy == client.Id.String() {
					delete(placeholders, key)
					changed = true
				}
			}
			r.State.Teams[client.Team].Placeholders = placeholders

			// Only send update if something changed
			if changed {
				r.State.Teams[client.Team].Letters = teamLetters
				finalMessage := PrepareEvent(UpdatedTeamLetterEvent, UpdatedTeamLettersResponse{
					TeamLetters:  teamLetters,
					Placeholders: placeholders,
				})

				for c := range r.Clients {
					if c.Team == client.Team {
						c.send <- finalMessage
					}
				}
			}
		}
	}
}
