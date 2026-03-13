package gameserver

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
)

type LockLetterAction struct {
	Client    *Client
	LetterId  uuid.UUID
	Placement map[string]PlacedTile
}

type UnlockSingleLetterAction struct {
	Client   *Client
	LetterId uuid.UUID
	TileKey  string
}

type SubmitTurnAction struct {
	Client   *Client
	NewTiles map[string]PlacedTile
}

type SubmitSpecialEffectAction struct {
	Client *Client
	X      int
	Y      int
	Type   SpecialType
}

type GameRoom struct {
	ID                 string
	Clients            map[*Client]bool
	State              *ServerGameState
	Broadcast          chan []byte
	Register           chan *Client
	Unregister         chan *Client
	ProcessMove        chan *SubmitTurnAction
	UpdateSettings     chan []byte
	UpdateUsername     chan *Client
	StartGame          chan *Client
	LockLetter         chan *LockLetterAction
	UnlockLetter       chan *Client
	UnlockSingleLetter chan *UnlockSingleLetterAction
	UpdateSpecialTiles chan *SubmitSpecialEffectAction
}

// NewRoom creates and returns a new GameRoom instance with the specified id.
// It initializes the room's communication channels and the underlying GameState.
func NewRoom(id string) *GameRoom {
	return &GameRoom{
		ID:                 id,
		Clients:            make(map[*Client]bool),
		State:              NewGameState(id),
		Broadcast:          make(chan []byte),
		Register:           make(chan *Client),
		Unregister:         make(chan *Client),
		ProcessMove:        make(chan *SubmitTurnAction),
		UpdateSettings:     make(chan []byte),
		UpdateUsername:     make(chan *Client),
		StartGame:          make(chan *Client),
		LockLetter:         make(chan *LockLetterAction),
		UnlockLetter:       make(chan *Client),
		UnlockSingleLetter: make(chan *UnlockSingleLetterAction),
		UpdateSpecialTiles: make(chan *SubmitSpecialEffectAction),
	}
}

// Run starts the main event loop for the GameRoom.
// It processes client joins/leaves, chat updates, game moves, timer ticks, and end-game state resolution.
func (r *GameRoom) Run() {
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for {
		select {

		// A client joins the room
		case client := <-r.Register:
			if r.State.GameStarted {
				client.send <- PrepareEvent(ErrorEvent, map[string]string{"message": "Spelet har redan börjat, kan inte ansluta"})
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

			newUser := User{
				UserId:   client.Id,
				Username: client.Username,
				Team:     assignedTeam,
			}

			r.State.Players[client.Id] = &newUser

			joinResponse := CreatedJoinGameResponse{
				GameState: r.State.ToClientState(client.Team),
				User:      newUser,
				Message:   "Du gick med i spelet!",
			}

			if client.Id != r.State.Host {
				client.send <- PrepareEvent(JoinedGameEvent, joinResponse)
			}

			log.Printf("[Room %s] Player '%s' joined (team=%s). Players in room: %d", r.ID, client.Username, assignedTeam, len(r.Clients))

			// Send out that the a new client has joined
			for c := range r.Clients {
				if c.Id != client.Id {
					c.send <- PrepareEvent(LobbyUpdateEvent, r.State.ToClientState(c.Team))
				}
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

			log.Printf("[Room %s] Player '%s' left. Players remaining: %d", r.ID, client.Username, len(r.Clients))

			// Delete the room if there are no other clients
			if len(r.Clients) == 0 {
				log.Printf("[Room %s] Room is empty, closing.", r.ID)
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
		case submitTurnAction := <-r.ProcessMove:
			if _, exists := r.State.Players[submitTurnAction.Client.Id]; !exists {
				continue
			}

			if r.State.GameOver {
				submitTurnAction.Client.send <- PrepareEvent(ErrorEvent, map[string]string{"message": "Tiden har gått ut"})
				r.UnlockLetter <- submitTurnAction.Client
				continue
			}

			isValid, message := isValidPlacement(submitTurnAction, &r.State.Board, &r.State.Roadblocks)
			if !isValid {
				submitTurnAction.Client.send <- PrepareEvent(ErrorEvent, map[string]string{"message": message})
				r.UnlockLetter <- submitTurnAction.Client
				continue
			}

			wordsCreated, moveScore := extractWordsAndScore(&submitTurnAction.NewTiles, &r.State.Board)
			if len(wordsCreated) == 0 {
				submitTurnAction.Client.send <- PrepareEvent(ErrorEvent, map[string]string{"message": "Du måste bilda ett ord på minst 2 bokstäver"})
				r.UnlockLetter <- submitTurnAction.Client
				continue
			}

			// Loop through and validate the words
			wordsValid := true
			for _, word := range wordsCreated {
				if !submitTurnAction.Client.hub.Dictionary.IsValid(word) {
					wordsValid = false
					break
				}

			}

			if !wordsValid {
				submitTurnAction.Client.send <- PrepareEvent(ErrorEvent, map[string]string{"message": "Bildat ett ogiltigt ord"})
				r.UnlockLetter <- submitTurnAction.Client
				continue
			}

			bombs := wordContainsBomb(&submitTurnAction.NewTiles, &r.State.Board, &r.State.Bombs)
			if len(bombs) > 0 {
				handleWordConnectedWithBomb(&bombs, submitTurnAction, r)
				continue
			}

			// Update team scoring
			r.State.Teams[submitTurnAction.Client.Team].Score += moveScore

			// Clear placeholders
			removePlaceholdersPlacedByClient(submitTurnAction.Client, r.State)

			player := r.State.Players[submitTurnAction.Client.Id]
			player.Score += moveScore
			player.TilesPlaced += len(submitTurnAction.NewTiles)

			// Add the tiles to the board
			for _, tile := range submitTurnAction.NewTiles {
				tile.State = TileStatePlaced
				r.State.Board[getTileKey(tile.X, tile.Y)] = tile
			}

			// Remove placeholders (if the collide)
			removeCollidingPlaceholders(submitTurnAction.Client.Team, r)

			// Remove letters from the hand
			teamLetters := r.State.Teams[submitTurnAction.Client.Team].Letters
			for _, tile := range submitTurnAction.NewTiles {
				delete(teamLetters, tile.Id)
			}

			// Draw new letters
			newLettersNeeded := len(submitTurnAction.NewTiles)
			drawnLetters := GenerateRandomLetters(newLettersNeeded)
			for _, drawnLetter := range drawnLetters {
				newID := uuid.New()
				teamLetters[newID] = TeamLetter{Id: newID, Letter: string(drawnLetter.Rune), IsLocked: false, LockedBy: uuid.Nil, Score: drawnLetter.Score}
			}
			r.State.Teams[submitTurnAction.Client.Team].Letters = teamLetters

			for client := range r.Clients {
				client.send <- PrepareEvent(BoardUpdateEvent, r.State.ToClientState(client.Team))
			}

		case payload := <-r.UpdateSettings:
			if r.State.GameStarted {
				continue
			}

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
			if r.State.GameStarted {
				hostClient.send <- PrepareEvent(ErrorEvent, map[string]string{"message": "Spelet har redan startat"})
				continue
			}

			if r.State.Host != hostClient.Id {
				hostClient.send <- PrepareEvent(ErrorEvent, map[string]string{"message": "Bara spelledaren kan starta spelet"})
				continue
			}

			r.State.PreStartGame(hostClient.hub)
			log.Printf("[Room %s] Game started. Players: %d", r.ID, len(r.Clients))

			for c := range r.Clients {
				c.send <- PrepareEvent(GameStartedEvent, r.State.ToClientState(c.Team))
			}

		case action := <-r.LockLetter:
			if r.State.GameOver {
				action.Client.send <- PrepareEvent(ErrorEvent, map[string]string{"message": "Tiden har gått ut"})
				continue
			}

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
				tile.PlacedBy = client.Id
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
			if r.State.GameOver {
				client.send <- PrepareEvent(ErrorEvent, map[string]string{"message": "Tiden har gått ut"})
				continue
			}

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

			placeholders := removePlaceholdersPlacedByClient(client, r.State)

			// Only send update if something changed
			if changed {
				r.State.Teams[client.Team].Letters = teamLetters
				finalMessage := PrepareEvent(UpdatedTeamLetterEvent, UpdatedTeamLettersResponse{TeamLetters: teamLetters, Placeholders: placeholders})

				for c := range r.Clients {
					if c.Team == client.Team {
						c.send <- finalMessage
					}
				}
			}
		case <-ticker.C:
			if r.State.GameStarted && !r.State.GameOver {
				now := time.Now().UnixMilli()

				// TODO: Check roadblocks, and schedule for deletion
				// TODO: Implement reward system based on board coverage with tiles

				if now >= r.State.EndTime {
					r.State.GameOver = true

					finalStats := r.State.GetFinalStats()

					log.Printf("[Room %s] Game over. Winner: %s. Score — A: %d, B: %d", r.ID, finalStats.Winner, finalStats.TeamPoints["a"], finalStats.TeamPoints["b"])
					gameOverMessage := PrepareEvent(GameOverEvent, finalStats)
					for client := range r.Clients {
						client.send <- gameOverMessage
					}

					r.State.ResetStatsAfterGameFinish()
				}
			}

		case action := <-r.UnlockSingleLetter:
			client := action.Client
			if r.State.GameOver {
				continue
			}

			teamLetters := r.State.Teams[client.Team].Letters
			changed := false

			if letter, exists := teamLetters[action.LetterId]; exists {
				if letter.IsLocked && letter.LockedBy == client.Id {
					letter.IsLocked = false
					letter.LockedBy = uuid.Nil
					teamLetters[action.LetterId] = letter
					changed = true
				}
			}

			placeholders := r.State.Teams[client.Team].Placeholders
			if tile, exists := placeholders[action.TileKey]; exists {
				if tile.PlacedBy == client.Id {
					delete(placeholders, action.TileKey)
					changed = true
				}
			}

			if changed {
				r.State.Teams[client.Team].Letters = teamLetters
				r.State.Teams[client.Team].Placeholders = placeholders

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

		case action := <-r.UpdateSpecialTiles:
			switch action.Type {
			case BombEffect:
				teamState := r.State.Teams[action.Client.Team]
				placed, message := tryPlaceBomb(action, &r.State.Bombs, teamState, &r.State.Board)

				if !placed {
					action.Client.send <- PrepareEvent(ErrorEvent, map[string]string{"message": message})
				} else {
					// Bomb was placed
					user := r.State.Players[action.Client.Id]
					user.PlacedBombs++
					teamState.Bombs--

					// Update the team
					for client := range r.Clients {
						if client.Team == action.Client.Team {
							client.send <- PrepareEvent(BoardUpdateEvent, r.State.ToClientState(client.Team))
						}
					}
				}
				continue

			case RoadblockEffect:
				teamState := r.State.Teams[action.Client.Team]
				combinedBoards := combineBoards(&teamState.Placeholders, &r.State.Board)
				placed, message, affectedTeams := tryPlaceRoadblock(action, &combinedBoards, &r.State.Roadblocks, r.State)

				if !placed {
					action.Client.send <- PrepareEvent(ErrorEvent, map[string]string{"message": message})
				} else {
					user := r.State.Players[action.Client.Id]
					user.PlacedRoadBlocks++
					teamState.Roadblocks--

					// Update so the other teams gets their placeholder updates
					for _, affectedTeam := range affectedTeams {
						teamMessage := PrepareEvent(UpdatedTeamLetterEvent, UpdatedTeamLettersResponse{
							TeamLetters:  r.State.Teams[affectedTeam].Letters,
							Placeholders: r.State.Teams[affectedTeam].Placeholders,
						})
						for c := range r.Clients {
							if c.Team == affectedTeam {
								c.send <- teamMessage
							}
						}
					}

					// Update so everyone sees the roadblocks
					for client := range r.Clients {
						client.send <- PrepareEvent(BoardUpdateEvent, r.State.ToClientState(client.Team))
					}
				}
				continue
			}
		}
	}
}

func handleWordConnectedWithBomb(bombs *[]Bomb, submitTurnAction *SubmitTurnAction, r *GameRoom) {
	for _, bomb := range *bombs {
		placedBombUser := r.State.Players[bomb.PlacedBy]
		triggeredExplosionUser := r.State.Players[submitTurnAction.Client.Id]

		placedBombUser.ExplosionsCaused++
		triggeredExplosionUser.TriggeredExplosions++

		triggeredExplosionUser.Score -= EXPLOSIONCAUSEDPOINTS
		r.State.Teams[triggeredExplosionUser.Team].Score -= EXPLOSIONCAUSEDPOINTS

		r.State.Players[submitTurnAction.Client.Id] = triggeredExplosionUser

		// Send information about bomb detonation (toast)
		if r.State.Players[bomb.PlacedBy].Team == submitTurnAction.Client.Team {
			r.State.Players[bomb.PlacedBy] = placedBombUser

			for c := range r.Clients {
				if c.Team == triggeredExplosionUser.Team && c.Id != triggeredExplosionUser.UserId {
					c.send <- PrepareEvent(BombExplodedEvent,
						BombExplodedPayload{
							Message: fmt.Sprintf("%s detonerade %s bomb", triggeredExplosionUser.Username, placedBombUser.Username),
							X:       bomb.X,
							Y:       bomb.Y,
							Bad:     true,
						})
				} else if c.Id == submitTurnAction.Client.Id {
					c.send <- PrepareEvent(BombExplodedEvent,
						BombExplodedPayload{
							Message: fmt.Sprintf("Du detonerade %s bomb", triggeredExplosionUser.Username),
							X:       bomb.X,
							Y:       bomb.Y,
							Bad:     true,
						})
				} else {
					c.send <- PrepareEvent(BombExplodedEvent,
						BombExplodedPayload{
							Message: fmt.Sprintf("%s detonerade %s bomb", triggeredExplosionUser.Username, placedBombUser.Username),
							X:       bomb.X,
							Y:       bomb.Y,
							Bad:     false,
						})
				}
			}
		} else {
			placedBombUser.Score += EXPLOSIONCAUSEDPOINTS
			r.State.Teams[placedBombUser.Team].Score += EXPLOSIONCAUSEDPOINTS

			r.State.Players[bomb.PlacedBy] = placedBombUser

			for c := range r.Clients {
				if c.Team == submitTurnAction.Client.Team {
					c.send <- PrepareEvent(BombExplodedEvent,
						BombExplodedPayload{
							Message: fmt.Sprintf("%s detonerade %s bomb", triggeredExplosionUser.Username, placedBombUser.Username),
							X:       bomb.X,
							Y:       bomb.Y,
							Bad:     true,
						})
				} else {
					c.send <- PrepareEvent(BombExplodedEvent,
						BombExplodedPayload{
							Message: fmt.Sprintf("%s detonerade %s bomb", triggeredExplosionUser.Username, placedBombUser.Username),
							X:       bomb.X,
							Y:       bomb.Y,
							Bad:     false,
						})
				}
			}
		}
	}

	removePlaceholdersPlacedByClient(submitTurnAction.Client, r.State)

	// Remove letters from the hand
	teamLetters := r.State.Teams[submitTurnAction.Client.Team].Letters
	for _, tile := range submitTurnAction.NewTiles {
		removePlaceholdersByLetterId(tile.Id, r.State.Teams[submitTurnAction.Client.Team])
		delete(teamLetters, tile.Id)
	}

	// Draw new letters
	newLettersNeeded := len(submitTurnAction.NewTiles)
	drawnLetters := GenerateRandomLetters(newLettersNeeded)
	for _, drawnLetter := range drawnLetters {
		newID := uuid.New()
		teamLetters[newID] = TeamLetter{Id: newID, Letter: string(drawnLetter.Rune), IsLocked: false, LockedBy: uuid.Nil, Score: drawnLetter.Score}
	}
	r.State.Teams[submitTurnAction.Client.Team].Letters = teamLetters

	// Update board
	for client := range r.Clients {
		client.send <- PrepareEvent(BoardUpdateEvent, r.State.ToClientState(client.Team))
	}
}
