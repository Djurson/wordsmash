package gameserver

import (
	"fmt"
	"math/rand"
	"time"

	"github.com/google/uuid"
)

type TileState string

const (
	TEAMHANDSIZE int = 15

	TileStatePlaced      TileState = "placed"
	TileStatePlaceholder TileState = "placeholder"
)

var letterBag []Letter
var letterScores map[rune]int

type User struct {
	Username string    `json:"username"`
	UserId   uuid.UUID `json:"userId"`
	Team     string    `json:"team"`
}

type Letter struct {
	Rune  rune
	Score int
}

type PlacedTile struct {
	Letter   string    `json:"letter"`
	X        int       `json:"x"`
	Y        int       `json:"y"`
	State    TileState `json:"state"`
	PlacedBy string    `json:"placedBy,omitempty"`
	Score    int       `json:"score"`
}

type Bomb struct {
	X        int    `json:"x"`
	Y        int    `json:"y"`
	PlacedBy string `json:"placedBy"`
}

type TeamLetter struct {
	Id       uuid.UUID `json:"id"`
	Letter   string    `json:"letter"`
	IsLocked bool      `json:"isLocked"`
	LockedBy uuid.UUID `json:"lockedBy"`
	Score    int       `json:"score"`
}

type TeamState struct {
	Score        int                      `json:"score"`
	Letters      map[uuid.UUID]TeamLetter `json:"teamLetters"`
	Placeholders map[string]PlacedTile    `json:"placeholders"`
}

type GameSettings struct {
	TimerMinutes int  `json:"timerMinutes"`
	EnableBombs  bool `json:"enableBombs"`
}

type ServerGameState struct {
	Board       map[string]PlacedTile
	Bombs       map[string]Bomb
	Teams       map[string]*TeamState
	GameId      string
	Settings    GameSettings
	Host        uuid.UUID
	GameStarted bool
	EndTime     int64
	StartTime   int64
	Players     map[uuid.UUID]*User
}

// Used to send information to client (only about their team)
type ClientGameState struct {
	Board       map[string]PlacedTile `json:"board"`
	Bombs       map[string]Bomb       `json:"bombs"`
	Team        *TeamState            `json:"team"`
	GameId      string                `json:"gameId"`
	Settings    GameSettings          `json:"settings"`
	Host        uuid.UUID             `json:"host"`
	GameStarted bool                  `json:"gameStarted"`
	EndTime     int64                 `json:"endTime"`
	StartTime   int64                 `json:"startTime"`
	TotalScore  int                   `json:"totalScore"`
	Players     map[uuid.UUID]*User   `json:"players"`
}

const ROUNDSTARTWAITTIME int = 5

func NewGameState(id string) *ServerGameState {
	return &ServerGameState{
		Board:   make(map[string]PlacedTile),
		Bombs:   make(map[string]Bomb),
		Players: make(map[uuid.UUID]*User),
		Teams: map[string]*TeamState{
			"a": {Score: 0, Letters: make(map[uuid.UUID]TeamLetter), Placeholders: make(map[string]PlacedTile)},
			"b": {Score: 0, Letters: make(map[uuid.UUID]TeamLetter), Placeholders: make(map[string]PlacedTile)},
		},
		GameId:   id,
		Settings: GameSettings{TimerMinutes: 5, EnableBombs: true},
	}
}

func (game *ServerGameState) PreStartGame(hub *GameHub) {
	for _, team := range game.Teams {
		letters := GenerateRandomLetters(TEAMHANDSIZE)

		for _, letter := range letters {
			id := uuid.New()
			team.Letters[id] = TeamLetter{Letter: string(letter.Rune), IsLocked: false, Id: id, Score: letter.Score}
		}
	}

	startWord := hub.Dictionary.RandomWord()
	runeWord := []rune(startWord)
	startX := int(len(runeWord) / 2)

	for x := range len(runeWord) {
		r := runeWord[x]

		game.Board[getTileKey((x-startX), 0)] = PlacedTile{
			Letter:   string(r),
			X:        x - startX,
			Y:        0,
			PlacedBy: "",
			State:    TileStatePlaced,
			Score:    letterScores[r],
		}
	}

	duration := time.Duration(game.Settings.TimerMinutes)*time.Minute + time.Duration(ROUNDSTARTWAITTIME)*time.Second
	game.EndTime = time.Now().Add(duration).UnixMilli()

	game.StartTime = time.Now().Add(time.Duration(5) * time.Second).UnixMilli()

	game.GameStarted = true
}

func (game *ServerGameState) ToClientState(team string) ClientGameState {
	totalScore := 0
	for _, t := range game.Teams {
		totalScore += t.Score
	}

	return ClientGameState{
		Board:       game.Board,
		Bombs:       game.Bombs,
		Team:        game.Teams[team],
		GameId:      game.GameId,
		Settings:    game.Settings,
		Host:        game.Host,
		GameStarted: game.GameStarted,
		EndTime:     game.EndTime,
		StartTime:   game.StartTime,
		TotalScore:  totalScore,
		Players:     game.Players,
	}
}

func getTileKey(x, y int) string {
	return fmt.Sprintf("%d,%d", x, y)
}

func scoreFromFrequency(count int, maxCount int) int {
	ratio := float64(count) / float64(maxCount)

	// Common letters score less -> rare letters score more
	switch {

	case ratio > 0.50:
		return 1
	case ratio > 0.25:
		return 2
	case ratio > 0.10:
		return 3
	case ratio > 0.04:
		return 4
	case ratio > 0.01:
		return 6
	default:
		return 8
	}
}

func InitLetterBag(freq map[rune]int) {
	bag := make([]Letter, 0)
	letterScores = make(map[rune]int)

	// Finds the max count for the most common letter
	maxCount := 0
	for _, count := range freq {
		if count > maxCount {
			maxCount = count
		}
	}

	for r, count := range freq {
		weight := count / 5000
		if weight < 1 {
			weight = 1
		}

		score := scoreFromFrequency(count, maxCount)
		letterScores[r] = score

		for i := 0; i < weight; i++ {
			bag = append(bag, Letter{Rune: r, Score: score})
		}
	}

	letterBag = bag
	fmt.Printf("Letter bag generated: %d unique, %d total tiles.\n", len(freq), len(letterBag))
}

func GenerateRandomLetters(count int) []Letter {
	seededRand := rand.New(rand.NewSource(time.Now().UnixNano()))

	hand := make([]Letter, count)

	for i := 0; i < count; i++ {
		randomIndex := seededRand.Intn(len(letterBag))
		hand[i] = letterBag[randomIndex]
	}

	return hand
}
