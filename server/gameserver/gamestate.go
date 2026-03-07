package gameserver

import (
	"fmt"
	"math/rand"
	"time"

	"github.com/google/uuid"
)

const (
	TEAMHANDSIZE int = 15
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

type TeamLetter struct {
	Id       uuid.UUID `json:"id"`
	Letter   rune      `json:"letter"`
	IsLocked bool      `json:"isLocked"`
	LockedBy uuid.UUID `json:"lockedBy"`
}

type TeamState struct {
	Score   int                      `json:"score"`
	Letters map[uuid.UUID]TeamLetter `json:"teamLetters"`
	Players map[uuid.UUID]*User      `json:"players"`
}

type GameSettings struct {
	TimerMinutes int  `json:"timerMinutes"`
	EnableBombs  bool `json:"enableBombs"`
}

type GameState struct {
	Board       map[string]PlacedTile `json:"board"`
	Bombs       map[string]Bomb       `json:"bombs"`
	Teams       map[string]*TeamState `json:"teams"`
	GameId      string                `json:"gameId"`
	Settings    GameSettings          `json:"settings"`
	Host        uuid.UUID             `json:"host"`
	GameStarted bool                  `json:"gameStarted"`
	EndTime     int64                 `json:"endTime"`
}

const ROUNDSTARTWAITTIME int = 5

func NewGameState(id string) *GameState {
	return &GameState{
		Board: make(map[string]PlacedTile),
		Bombs: make(map[string]Bomb),
		Teams: map[string]*TeamState{
			"a": {
				Score:   0,
				Letters: make(map[uuid.UUID]TeamLetter),
				Players: make(map[uuid.UUID]*User),
			},
			"b": {
				Score:   0,
				Letters: make(map[uuid.UUID]TeamLetter),
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
		letters := GenerateRandomLetters(TEAMHANDSIZE)

		for _, letter := range letters {
			id := uuid.New()
			team.Letters[id] = TeamLetter{Letter: letter, IsLocked: false, Id: id}
		}
	}

	startWord := hub.Dictionary.RandomWord()
	runeWord := []rune(startWord)
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

	duration := time.Duration(game.Settings.TimerMinutes)*time.Minute + time.Duration(ROUNDSTARTWAITTIME)*time.Second
	game.EndTime = time.Now().Add(duration).UnixMilli()

	game.GameStarted = true
}

func getTileKey(x, y int) string {
	return fmt.Sprintf("%d,%d", x, y)
}

func GenerateRandomLetters(count int) []rune {
	letters := []rune("abcdefghijklmnopqrstuvwxyzåäö")
	seededRand := rand.New(rand.NewSource(time.Now().UnixNano()))
	hand := make([]rune, count)
	for i := 0; i < count; i++ {
		randomIndex := seededRand.Intn(len(letters))
		hand[i] = rune(letters[randomIndex])
	}

	return hand
}
