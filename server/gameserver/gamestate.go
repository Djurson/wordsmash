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

type User struct {
	Username string    `json:"username"`
	UserId   uuid.UUID `json:"userId"`
	Team     string    `json:"team"`
}

type PlacedTile struct {
	Letter   string    `json:"letter"`
	X        int       `json:"x"`
	Y        int       `json:"y"`
	State    TileState `json:"state"`
	PlacedBy string    `json:"placedBy,omitempty"`
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
		GameId: id,
		Settings: GameSettings{
			TimerMinutes: 5,
			EnableBombs:  true,
		},
	}
}

func (game *ServerGameState) PreStartGame(hub *GameHub) {
	for _, team := range game.Teams {
		letters := GenerateRandomLetters(TEAMHANDSIZE)

		for _, letter := range letters {
			id := uuid.New()
			team.Letters[id] = TeamLetter{Letter: string(letter), IsLocked: false, Id: id}
		}
	}

	startWord := hub.Dictionary.RandomWord()
	runeWord := []rune(startWord)
	startX := int(len(runeWord) / 2)

	for x := range len(runeWord) {
		game.Board[getTileKey((x-startX), 0)] = PlacedTile{
			Letter:   string(runeWord[x]),
			X:        x - startX,
			Y:        0,
			PlacedBy: "",
			State:    TileStatePlaced,
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
