package gameserver

import (
	"encoding/json"

	"github.com/google/uuid"
)

type EventType string

const (
	GameCreatedEvent        EventType = "game_created"         // Go (server) -> React (client)
	JoinedGameEvent         EventType = "joined_game"          // Go (server) -> React (client)
	ErrorEvent              EventType = "error"                // Go (server) -> React (client)
	SuccessEvent            EventType = "success"              // Go (server) -> React (client)
	LobbyUpdateEvent        EventType = "lobby_updated"        // Go (server) -> React (client)
	GameStartedEvent        EventType = "game_started"         // Go (server) -> React (client)
	BoardUpdateEvent        EventType = "board_updated"        // Go (server) -> React (client)
	ConnectedToServerEvent  EventType = "server_connected"     // Go (server) -> React (client)
	SettingsUpdatedEvent    EventType = "updated_settings"     // Go (server) -> React (client)
	LeftRoomEvent           EventType = "left_room"            // Go (server) -> React (client)
	UpdatedTeamLetterEvent  EventType = "team_letter_updated"  // Go (server) -> React (client)
	GameOverEvent           EventType = "game_over"            // Go (server) -> React (client)
	BombExplodedEvent       EventType = "bomb_exploded"        // Go (server) -> React (client)
	CreateGameEvent         EventType = "create_game"          // React (client) -> Go (server)
	JoinGameEvent           EventType = "join_game"            // React (client) -> Go (server)
	SubmitTurnEvent         EventType = "submit_turn"          // React (client) -> Go (server)
	UpdateSettingsEvent     EventType = "update_settings"      // React (client) -> Go (server)
	UpdateUsernameEvent     EventType = "update_username"      // React (client) -> Go (server)
	LeaveRoomEvent          EventType = "leave_room"           // React (client) -> Go (server)
	StartGameEvent          EventType = "start_game"           // React (client) -> Go (server)
	LockLetterEvent         EventType = "lock_letter"          // React (client) -> Go (server)
	UnlockLetterEvent       EventType = "unlock_letter"        // React (client) -> Go (server)
	UnlockSingleLetterEvent EventType = "unlock_single_letter" // React (client) -> Go (server)
	SubmitBombEvent         EventType = "submit_bomb"          // React (client) -> Go (server)
	SubmitRoadblockEvent    EventType = "submit_roadblock"     // React (client) -> Go (server)
	SubmitTradeInEvent      EventType = "submit_trade_in"      // React (client) -> Go (server)
)

type Event struct {
	Type    EventType       `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

// Payload sent by the client when game_create event is sent
type CreateGamePayload struct {
	Username string       `json:"username"`
	Settings GameSettings `json:"settings"`
}

// Payload sent by react to update username
type UpdateUsernamePayload struct {
	Username string `json:"username"`
}

// Payload sent by the client when join_game event is sent
type JoinGamePayload struct {
	GameCode string `json:"gameCode"`
	Username string `json:"username"`
}

// Response from server to client
type CreatedJoinGameResponse struct {
	GameState ClientGameState `json:"gamestate"`
	User      User            `json:"user"`
	Message   string          `json:"message"`
}

type UpdatedTeamLettersResponse struct {
	TeamLetters  map[uuid.UUID]TeamLetter `json:"teamLetters"`
	Placeholders map[string]PlacedTile    `json:"placeholders"`
}

type LockLetterPayload struct {
	LetterId  uuid.UUID             `json:"letterId"`
	Placement map[string]PlacedTile `json:"placement"`
}

type SubmitTurnPayload struct {
	NewTiles map[string]PlacedTile `json:"newTiles"`
}

type Stat struct {
	Username string `json:"username"`
	Value    int    `json:"value"`
}

type FinalGameStats struct {
	MostPlacedTiles      Stat           `json:"mostPlacedTiles"`
	MostPoints           Stat           `json:"mostPoints"`
	MostPlacedBombs      Stat           `json:"mostPlacedBombs"`
	MostTriggeredBombs   Stat           `json:"mostTriggeredBombs"`
	MostCausedExplosions Stat           `json:"mostCausedExplosions"`
	MostPlacedRoadblocks Stat           `json:"mostPlacedRoadblocks"`
	TeamPoints           map[string]int `json:"teamPoints"`
	Winner               string         `json:"winner"`
}

type UnlockSingleLetterPayload struct {
	LetterId uuid.UUID `json:"letterId"`
	TileKey  string    `json:"tileKey"`
}

type SubmitSpecialEffectPayload struct {
	X int `json:"x"`
	Y int `json:"y"`
}

type BombExplodedPayload struct {
	X       int    `json:"x"`
	Y       int    `json:"y"`
	Message string `json:"message"`
	Bad     bool   `json:"bad"`
}

type SubmitTradeInPayload struct {
	LetterIds []uuid.UUID `json:"letterIds"`
}
