package gameserver

import (
	"fmt"
	"math/rand"
	"time"

	"github.com/google/uuid"
)

type PlacedTile struct {
	Letter string `json:"letter"`
	X      int    `json:"x"`
	Y      int    `json:"y"`
	Team   string `json:"team"`
	State  string `json:"state"`
}

type Bomb struct {
	X        int    `json:"x"`
	Y        int    `json:"y"`
	PlacedBy string `json:"placed_by"`
}

// Simplified client type that is sent to the frontend
type PlayerInfo struct {
	ID   uuid.UUID `json:"id"`
	Name string    `json:"name"`
}

type TeamState struct {
	Score   int                      `json:"score"`
	Letters []string                 `json:"letters"`
	Players map[uuid.UUID]PlayerInfo `json:"players"`
}

type GameState struct {
	Board map[string]PlacedTile `json:"board"`
	Bombs map[string]Bomb       `json:"bombs"`
	Teams map[string]*TeamState `json:"teams"`
}

func NewGameState() *GameState {
	return &GameState{
		Board: make(map[string]PlacedTile),
		Bombs: make(map[string]Bomb),
		Teams: map[string]*TeamState{
			"a": {
				Score:   0,
				Letters: GenerateRandomLetters(15),
				Players: make(map[uuid.UUID]PlayerInfo),
			},
			"b": {
				Score:   0,
				Letters: GenerateRandomLetters(15),
				Players: make(map[uuid.UUID]PlayerInfo),
			},
		},
	}
}

func getTileKey(x, y int) string {
	return fmt.Sprintf("%d,%d", x, y)
}

func GenerateRandomLetters(count int) []string {
	letters := "abcdefghijklmnopqrstuvwxyzåäö"
	seededRand := rand.New(rand.NewSource(time.Now().UnixNano()))
	hand := make([]string, count)
	for i := 0; i < count; i++ {
		randomIndex := seededRand.Intn(len(letters))
		hand[i] = string(letters[randomIndex])
	}

	return hand
}
