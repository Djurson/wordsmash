package gameserver

import "encoding/json"

type Event struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

type GameCreatedPayload struct {
	GameCode string `json:"gameCode"`
}

type JoinGamePayload struct {
	GameCode string `json:"gameCode"`
	User     User
}
