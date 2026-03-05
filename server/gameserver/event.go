package gameserver

import "encoding/json"

type EventType string

const (
	GameCreatedEvent       EventType = "game_created"
	JoinedGameEvent        EventType = "joined_game"
	ErrorEvent             EventType = "error"
	LobbyUpdateEvent       EventType = "lobby_updated"
	GameStartedEvent       EventType = "game_started"
	BoardUpdateEvent       EventType = "board_updated"
	ConnectedToServerEvent EventType = "server_connected"
)

type Event struct {
	Type    EventType       `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

func PrepareEvent(eventType EventType, payload any) []byte {
	payloadBytes, _ := json.Marshal(payload)

	updateEvent := Event{
		Type:    eventType,
		Payload: payloadBytes,
	}

	finalMessage, _ := json.Marshal(updateEvent)

	return finalMessage
}

// Payload sent by the client when game_create event is sent
type CreateGamePayload struct {
	Username string `json:"username"`
}

// Payload sent by the client when join_game event is sent
type JoinGamePayload struct {
	GameCode string `json:"gameCode"`
	Username string `json:"username"`
}

// Response from server to client
type GameCreatedPayload struct {
	GameCode string `json:"gameCode"`
}
