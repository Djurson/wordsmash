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
	State  string `json:"state"` // "placed" | "placeholder"
}

type Bomb struct {
	X        int    `json:"x"`
	Y        int    `json:"y"`
	PlacedBy string `json:"placedBy"`
}

type TeamState struct {
	Score   int                 `json:"score"`
	Letters []string            `json:"letters"`
	Players map[uuid.UUID]*User `json:"players"`
}

type GameSettings struct {
	TimerMinutes int  `json:"timerMinutes"`
	EnableBombs  bool `json:"enableBombs"`
}

type GameState struct {
	Board     map[string]PlacedTile `json:"board"`
	Bombs     map[string]Bomb       `json:"bombs"`
	Teams     map[string]*TeamState `json:"teams"`
	TimeLeft  int                   `json:"timeLeft"`
	GameId    string                `json:"gameId"`
	Settings  GameSettings          `json:"settings"`
	Host      uuid.UUID             `json:"host"`
	StartWord string                `json:"startWord"`
}

func NewGameState(id string) *GameState {
	return &GameState{
		Board: make(map[string]PlacedTile),
		Bombs: make(map[string]Bomb),
		Teams: map[string]*TeamState{
			"a": {
				Score:   0,
				Letters: make([]string, 0),
				Players: make(map[uuid.UUID]*User),
			},
			"b": {
				Score:   0,
				Letters: make([]string, 0),
				Players: make(map[uuid.UUID]*User),
			},
		},
		GameId: id,
		Settings: GameSettings{
			TimerMinutes: 5,
			EnableBombs:  true,
		},
	}
}

func (game *GameState) PreStartGame(hub *GameHub) {
	for _, team := range game.Teams {
		team.Letters = GenerateRandomLetters(15)
	}

	game.StartWord = hub.Dictionary.RandomWord()
	runeWord := []rune(game.StartWord)
	startX := int(len(runeWord) / 2)

	for x := range len(runeWord) {
		game.Board[getTileKey((x-startX), 0)] = PlacedTile{
			Letter: string(runeWord[x]),
			X:      x - startX,
			Y:      0,
			Team:   "",
			State:  "placed",
		}
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
