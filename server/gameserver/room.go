package gameserver

import (
	"encoding/json"
	"fmt"
	"sort"
	"time"

	"github.com/google/uuid"
)

type LockLetterAction struct {
	Client    *Client
	LetterId  uuid.UUID
	Placement map[string]PlacedTile
}

type SubmitTurnAction struct {
	Client   *Client
	NewTiles map[string]PlacedTile
	NewBombs map[string]Bomb
}

type GameRoom struct {
	ID             string
	Clients        map[*Client]bool
	State          *ServerGameState
	Broadcast      chan []byte
	Register       chan *Client
	Unregister     chan *Client
	ProcessMove    chan SubmitTurnAction
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
		ProcessMove:    make(chan SubmitTurnAction),
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
		case submitTurnAction := <-r.ProcessMove:
			if r.State.EndTime < time.Now().UnixMilli() {
				submitTurnAction.Client.send <- PrepareEvent(ErrorEvent, map[string]string{"message": "Tiden har gått ut"})
				continue
			}

			isValid, message := isValidPlacement(&submitTurnAction, &r.State.Board, &r.State.Bombs)
			if !isValid {
				submitTurnAction.Client.send <- PrepareEvent(ErrorEvent, map[string]string{"message": message})
				continue
			}

			wordsCreated, moveScore := extractWordsAndScore(&submitTurnAction.NewTiles, &r.State.Board)

			if len(wordsCreated) == 0 {
				submitTurnAction.Client.send <- PrepareEvent(ErrorEvent, map[string]string{"message": "Du måste bilda ett ord på minst 2 bokstäver"})
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
				continue
			}

			// Update team scoring
			r.State.Teams[submitTurnAction.Client.Team].Score += moveScore

			// Clear placeholders
			placeholders := r.State.Teams[submitTurnAction.Client.Team].Placeholders
			for key, tile := range placeholders {
				if tile.PlacedBy == submitTurnAction.Client.Id.String() {
					delete(placeholders, key)
				}
			}
			r.State.Teams[submitTurnAction.Client.Team].Placeholders = placeholders

			// Add the tiles to the board
			for _, tile := range submitTurnAction.NewTiles {
				tile.State = TileStatePlaced
				r.State.Board[getTileKey(tile.X, tile.Y)] = tile
			}

			// Remove placeholders (if the collide)
			for teamName, teamState := range r.State.Teams {
				if teamName == submitTurnAction.Client.Team {
					continue
				}

				teamWasPudlad := false
				placeholders := teamState.Placeholders
				letters := teamState.Letters

				for key, pTile := range placeholders {
					// Check for collision
					if _, exists := r.State.Board[key]; exists {

						// Unlock letter
						if letter, exists := letters[pTile.Id]; exists {
							letter.IsLocked = false
							letter.LockedBy = uuid.Nil
							letters[pTile.Id] = letter
						}

						delete(placeholders, key)
						teamWasPudlad = true
					}
				}

				if teamWasPudlad {
					r.State.Teams[teamName].Placeholders = placeholders
					r.State.Teams[teamName].Letters = letters

					teamMessage := PrepareEvent(UpdatedTeamLetterEvent, UpdatedTeamLettersResponse{
						TeamLetters:  letters,
						Placeholders: placeholders,
					})
					for c := range r.Clients {
						if c.Team == teamName {
							c.send <- teamMessage
						}
					}
				}
			}

			teamLetters := r.State.Teams[submitTurnAction.Client.Team].Letters
			for _, tile := range submitTurnAction.NewTiles {
				delete(teamLetters, tile.Id)
			}

			// TODO: Implement bombs
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

			teamMessage := PrepareEvent(UpdatedTeamLetterEvent, UpdatedTeamLettersResponse{
				TeamLetters:  teamLetters,
				Placeholders: r.State.Teams[submitTurnAction.Client.Team].Placeholders,
			})
			for client := range r.Clients {
				if client.Team == submitTurnAction.Client.Team {
					client.send <- teamMessage
				}
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

			for c := range r.Clients {
				c.send <- PrepareEvent(GameStartedEvent, r.State.ToClientState(c.Team))
			}

		case action := <-r.LockLetter:
			if r.State.EndTime < time.Now().UnixMilli() {
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
			if r.State.EndTime < time.Now().UnixMilli() {
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
				finalMessage := PrepareEvent(UpdatedTeamLetterEvent, UpdatedTeamLettersResponse{TeamLetters: teamLetters, Placeholders: placeholders})

				for c := range r.Clients {
					if c.Team == client.Team {
						c.send <- finalMessage
					}
				}
			}
		}
	}
}

/* Same implementation as client/lib/utils.ts */
func isValidPlacement(turnAction *SubmitTurnAction, board *map[string]PlacedTile, bombs *map[string]Bomb) (bool, string) {
	if len(turnAction.NewTiles) == 0 && len(turnAction.NewBombs) == 0 {
		return false, "Behöver placera ut minst en bricka eller bomb"
	}

	if len(turnAction.NewTiles) > 0 {
		hasPlacedNeighbor := false
		var xs []int
		var ys []int

		for key, tile := range turnAction.NewTiles {
			// Check overlap with already placed tiles
			if _, exists := (*board)[key]; exists {
				return false, "En av rutorna är redan upptagen på brädet"
			}

			// Does the key match the coordinates
			if key != getTileKey(tile.X, tile.Y) {
				return false, "Ogiltig data: Koordinaterna stämmer inte överens"
			}

			xs = append(xs, tile.X)
			ys = append(ys, tile.Y)

			// Does the tile touch any placed brackets
			if checkTileNeighbors(tile.X, tile.Y, board) {
				hasPlacedNeighbor = true
			}
		}

		if !hasPlacedNeighbor {
			return false, "Ditt ord måste sitta ihop med de befintliga brickorna på brädet"
		}

		// Direction checking
		if len(turnAction.NewTiles) > 1 {
			isHorizontal := true
			isVertical := true

			firstX, firstY := xs[0], ys[0]

			// Check if they share the same row or column
			for i := 1; i < len(xs); i++ {
				if xs[i] != firstX {
					isVertical = false
				}
				if ys[i] != firstY {
					isHorizontal = false
				}
			}

			if !isHorizontal && !isVertical {
				return false, "Brickorna måste ligga på en rak horisontell eller vertikal linje"
			}

			// Check if there are any gaps
			if isHorizontal {
				sort.Ints(xs)
				minX, maxX := xs[0], xs[len(xs)-1]

				for x := minX; x <= maxX; x++ {
					checkKey := getTileKey(x, firstY)
					_, inNewTiles := turnAction.NewTiles[checkKey]
					_, inBoard := (*board)[checkKey]

					if !inNewTiles && !inBoard {
						return false, "Det finns luckor i ditt ord. Brickorna måste sitta ihop"
					}
				}
			} else if isVertical {
				sort.Ints(ys)
				minY, maxY := ys[0], ys[len(ys)-1]

				for y := minY; y <= maxY; y++ {
					checkKey := getTileKey(firstX, y)
					_, inNewTiles := turnAction.NewTiles[checkKey]
					_, inBoard := (*board)[checkKey]

					if !inNewTiles && !inBoard {
						return false, "Det finns luckor i ditt ord. Brickorna måste sitta ihop"
					}
				}
			}
		}
	}

	// TODO: Add new separate checking for Bombs

	return true, ""
}

func checkTileNeighbors(x int, y int, board *map[string]PlacedTile) bool {
	neighborsKeys := []string{
		getTileKey(x+1, y),
		getTileKey(x-1, y),
		getTileKey(x, y+1),
		getTileKey(x, y-1),
	}

	for _, key := range neighborsKeys {
		if _, exists := (*board)[key]; exists {
			return true
		}
	}

	return false
}

func extractWordsAndScore(newTiles *map[string]PlacedTile, board *map[string]PlacedTile) ([]string, int) {
	var words []string
	totalScore := 0

	// Combine the boards
	fullBoard := make(map[string]PlacedTile)
	for k, v := range *board {
		fullBoard[k] = v
	}
	for k, v := range *newTiles {
		fullBoard[k] = v
	}

	// Get the first tile in the new tiles
	var firstPlacedTile PlacedTile
	for _, t := range *newTiles {
		firstPlacedTile = t
		break
	}

	isHorizontal := true
	for _, t := range *newTiles {
		if t.Y != firstPlacedTile.Y {
			isHorizontal = false
			break
		}
	}

	if len(*newTiles) == 1 {
		isHorizontal = true
	}

	// Extract the main word
	mainWord, mainScore := extractWordAt(firstPlacedTile.X, firstPlacedTile.Y, isHorizontal, &fullBoard)
	if len(mainWord) > 1 {
		words = append(words, mainWord)
		totalScore += mainScore
	}

	// Extract cross words
	for _, tile := range *newTiles {
		crossWord, crossScore := extractWordAt(tile.X, tile.Y, !isHorizontal, &fullBoard)
		if len(crossWord) > 1 {
			words = append(words, crossWord)
			totalScore += crossScore
		}
	}

	return words, totalScore
}

func extractWordAt(startX, startY int, horizontal bool, fullBoard *map[string]PlacedTile) (string, int) {
	word := ""
	score := 0
	length := 0

	x, y := startX, startY

	// Go back to the begining of the word
	for {
		prevX, prevY := x, y
		if horizontal {
			prevX--
		} else {
			prevY--
		}
		if _, exists := (*fullBoard)[getTileKey(prevX, prevY)]; !exists {
			break
		}
		x, y = prevX, prevY
	}

	// Move forward and collect characters
	for {
		key := getTileKey(x, y)
		tile, exists := (*fullBoard)[key]
		if !exists {
			break
		}

		word += tile.Letter
		score += tile.Score
		length += 1

		if horizontal {
			x++
		} else {
			y++
		}
	}

	return word, score
}
