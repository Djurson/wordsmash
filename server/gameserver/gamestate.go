package gameserver

import (
	"fmt"
	"math/rand"
	"time"

	"github.com/google/uuid"
)

type TileState string
type SpecialType string

const (
	TEAMHANDSIZE       int = 15
	ROUNDSTARTWAITTIME int = 5

	STARTBOMBS      int = 100
	STARTROADBLOCKS int = 100

	EXPLOSIONCAUSEDPOINTS int = 5

	TileStatePlaced      TileState = "placed"
	TileStatePlaceholder TileState = "placeholder"

	BombEffect      SpecialType = "bomb"
	RoadblockEffect SpecialType = "roadblock"
)

var letterBag []Letter
var letterScores map[rune]int

type User struct {
	Username            string    `json:"username"`
	UserId              uuid.UUID `json:"userId"`
	Team                string    `json:"team"`
	Score               int       `json:"score"`
	TilesPlaced         int       `json:"tilesPlaced"`
	PlacedBombs         int       `json:"placedBombs"`
	PlacedRoadBlocks    int       `json:"placedRoadblocks"`
	TriggeredExplosions int       `json:"triggeredExplosions"`
	ExplosionsCaused    int       `json:"explosionsCaused"`
}

type Letter struct {
	Rune  rune
	Score int
}

type PlacedTile struct {
	Id       uuid.UUID `json:"id"`
	Letter   string    `json:"letter"`
	X        int       `json:"x"`
	Y        int       `json:"y"`
	State    TileState `json:"state"`
	PlacedBy uuid.UUID `json:"placedBy,omitempty"`
	Score    int       `json:"score"`
}

type Bomb struct {
	PlacedBy uuid.UUID `json:"id"`
	X        int       `json:"x"`
	Y        int       `json:"y"`
	Team     string    `json:"team"`
}

type Roadblock struct {
	PlacedBy  uuid.UUID `json:"placedBy"`
	X         int       `json:"x"`
	Y         int       `json:"y"`
	ExpiresAt int64     `json:"expiresAt"`
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
	Roadblocks   int                      `json:"roadblocks"`
	Bombs        int                      `json:"bombs"`
}

type GameSettings struct {
	TimerMinutes      int  `json:"timerMinutes"`
	EnableBombs       bool `json:"enableBombs"`
	EnableRoadblocks  bool `json:"enableRoadblocks"`
	RoadblockDuration int  `json:"roadblockDuration"`
}

type ServerGameState struct {
	Board       map[string]PlacedTile
	Bombs       map[string]Bomb
	Roadblocks  map[string]Roadblock
	Teams       map[string]*TeamState
	GameId      string
	Settings    GameSettings
	Host        uuid.UUID
	GameStarted bool
	GameOver    bool
	EndTime     int64
	StartTime   int64
	Players     map[uuid.UUID]*User
}

// Used to send information to client (only about their team)
type ClientGameState struct {
	Board       map[string]PlacedTile `json:"board"`
	Bombs       map[string]Bomb       `json:"bombs"`
	Roadblocks  map[string]Roadblock  `json:"roadblocks"`
	Team        *TeamState            `json:"team"`
	GameId      string                `json:"gameId"`
	Settings    GameSettings          `json:"settings"`
	Host        uuid.UUID             `json:"host"`
	GameStarted bool                  `json:"gameStarted"`
	GameOver    bool                  `json:"gameOver"`
	EndTime     int64                 `json:"endTime"`
	StartTime   int64                 `json:"startTime"`
	TotalScore  int                   `json:"totalScore"`
	Players     map[uuid.UUID]*User   `json:"players"`
}

// NewGameState creates and initializes a new ServerGameState for the given game id.
// It sets up the default empty board, team structures, and default game settings.
func NewGameState(id string) *ServerGameState {
	return &ServerGameState{
		Board:      make(map[string]PlacedTile),
		Bombs:      make(map[string]Bomb),
		Roadblocks: make(map[string]Roadblock),
		Players:    make(map[uuid.UUID]*User),
		Teams: map[string]*TeamState{
			"a": {Score: 0, Letters: make(map[uuid.UUID]TeamLetter), Placeholders: make(map[string]PlacedTile)},
			"b": {Score: 0, Letters: make(map[uuid.UUID]TeamLetter), Placeholders: make(map[string]PlacedTile)},
		},
		GameId:   id,
		Settings: GameSettings{TimerMinutes: 5, EnableBombs: true, EnableRoadblocks: true, RoadblockDuration: 10},
	}
}

// PreStartGame prepares the state for a new game.
// It generates starting hands for the teams, calculates game timers,
// and places the initial random start word in the center of the board.
func (game *ServerGameState) PreStartGame(hub *GameHub) {
	for _, team := range game.Teams {
		letters := GenerateRandomLetters(TEAMHANDSIZE)

		for _, letter := range letters {
			id := uuid.New()
			team.Letters[id] = TeamLetter{Letter: string(letter.Rune), IsLocked: false, Id: id, Score: letter.Score}
		}

		team.Roadblocks = STARTROADBLOCKS
		team.Bombs = STARTBOMBS
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
			PlacedBy: uuid.Nil,
			State:    TileStatePlaced,
			Score:    letterScores[r],
			Id:       uuid.New(),
		}
	}

	duration := time.Duration(game.Settings.TimerMinutes)*time.Minute + time.Duration(ROUNDSTARTWAITTIME)*time.Second
	game.EndTime = time.Now().Add(duration).UnixMilli()

	game.StartTime = time.Now().Add(time.Duration(5) * time.Second).UnixMilli()
	game.GameStarted = true
}

// ToClientState converts the internal ServerGameState into a ClientGameState tailored for a specific team.
// It calculates the total score and strips away the opponent's private data before returning.
func (game *ServerGameState) ToClientState(team string) ClientGameState {
	totalScore := 0
	for _, t := range game.Teams {
		totalScore += t.Score
	}

	filteredBombs := make(map[string]Bomb)
	for key, bomb := range game.Bombs {
		if bomb.Team == team {
			filteredBombs[key] = bomb
		}
	}

	return ClientGameState{
		Board:       game.Board,
		Bombs:       filteredBombs,
		Roadblocks:  game.Roadblocks,
		Team:        game.Teams[team],
		GameId:      game.GameId,
		Settings:    game.Settings,
		Host:        game.Host,
		GameStarted: game.GameStarted,
		GameOver:    game.GameOver,
		EndTime:     game.EndTime,
		StartTime:   game.StartTime,
		TotalScore:  totalScore,
		Players:     game.Players,
	}
}

// InitLetterBag populates the global letterBag based on the provided letter frequencies.
// It calculates the weight and score for each rune, filling the bag with Letter structs.
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

// GenerateRandomLetters draws the specified count of random letters from the global letter bag
// and returns them as a slice.
func GenerateRandomLetters(count int) []Letter {
	seededRand := rand.New(rand.NewSource(time.Now().UnixNano()))

	hand := make([]Letter, count)

	for i := 0; i < count; i++ {
		randomIndex := seededRand.Intn(len(letterBag))
		hand[i] = letterBag[randomIndex]
	}

	return hand
}

// ResetStatsAfterGameFinish clears the board, special tiles, and resets team/player scoring stats.
// It resets the game state so a new round can be started in the same room.
func (game *ServerGameState) ResetStatsAfterGameFinish() {
	game.Board = make(map[string]PlacedTile)
	game.Bombs = make(map[string]Bomb)
	game.Roadblocks = make(map[string]Roadblock)
	game.GameOver = false

	game.GameStarted = false
	game.EndTime = 0
	game.StartTime = 0

	for _, team := range game.Teams {
		team.Score = 0
		team.Letters = make(map[uuid.UUID]TeamLetter)
		team.Placeholders = make(map[string]PlacedTile)
	}

	for _, p := range game.Players {
		p.Score = 0
		p.TilesPlaced = 0
	}
}

// GetFinalStats summarises the game and gets the game stats such as top scorer, top bomb placer etc
// and returns a FinalGameStats payload for a game over event
func (game *ServerGameState) GetFinalStats() FinalGameStats {
	var topTileUser, topScoreUser, topBombUser, topTriggerBombsUser, topCauseExplosionsUser, topRoadblockUser *User

	var EmptyStat Stat = Stat{Username: "Ingen", Value: 0}

	for _, player := range game.Players {
		if topTileUser == nil || player.TilesPlaced > topTileUser.TilesPlaced {
			topTileUser = player
		}
		if topScoreUser == nil || player.Score > topScoreUser.Score {
			topScoreUser = player
		}
		if topBombUser == nil || player.PlacedBombs > topBombUser.PlacedBombs {
			topBombUser = player
		}
		if topTriggerBombsUser == nil || player.TriggeredExplosions > topTriggerBombsUser.TriggeredExplosions {
			topTriggerBombsUser = player
		}
		if topCauseExplosionsUser == nil || player.ExplosionsCaused > topCauseExplosionsUser.ExplosionsCaused {
			topCauseExplosionsUser = player
		}
		if topRoadblockUser == nil || player.PlacedRoadBlocks > topRoadblockUser.PlacedRoadBlocks {
			topRoadblockUser = player
		}
	}

	mostPlacedTiles := EmptyStat
	if topTileUser != nil && topTileUser.TilesPlaced > 0 {
		mostPlacedTiles = Stat{Username: topTileUser.Username, Value: topTileUser.TilesPlaced}
	}

	mostPoints := EmptyStat
	if topScoreUser != nil && topScoreUser.Score > 0 {
		mostPoints = Stat{Username: topScoreUser.Username, Value: topScoreUser.Score}
	}

	mostPlacedBombs := EmptyStat
	if topBombUser != nil && topBombUser.PlacedBombs > 0 {
		mostPlacedBombs = Stat{Username: topBombUser.Username, Value: topBombUser.PlacedBombs}
	}

	mostTriggeredBombs := EmptyStat
	if topTriggerBombsUser != nil && topTriggerBombsUser.TriggeredExplosions > 0 {
		mostTriggeredBombs = Stat{Username: topTriggerBombsUser.Username, Value: topTriggerBombsUser.TriggeredExplosions}
	}

	mostCausedExplosions := EmptyStat
	if topCauseExplosionsUser != nil && topCauseExplosionsUser.ExplosionsCaused > 0 {
		mostCausedExplosions = Stat{Username: topCauseExplosionsUser.Username, Value: topCauseExplosionsUser.ExplosionsCaused}
	}

	mostPlacedRoadblocks := EmptyStat
	if topRoadblockUser != nil && topRoadblockUser.PlacedRoadBlocks > 0 {
		mostPlacedRoadblocks = Stat{Username: topRoadblockUser.Username, Value: topRoadblockUser.PlacedRoadBlocks}
	}

	teamPoints := map[string]int{
		"a": game.Teams["a"].Score,
		"b": game.Teams["b"].Score,
	}

	winner := "tie"
	if teamPoints["a"] > teamPoints["b"] {
		winner = "a"
	} else if teamPoints["b"] > teamPoints["a"] {
		winner = "b"
	}

	return FinalGameStats{
		MostPlacedTiles:      mostPlacedTiles,
		MostPoints:           mostPoints,
		MostPlacedBombs:      mostPlacedBombs,
		MostTriggeredBombs:   mostTriggeredBombs,
		MostCausedExplosions: mostCausedExplosions,
		MostPlacedRoadblocks: mostPlacedRoadblocks,
		TeamPoints:           teamPoints,
		Winner:               winner,
	}
}
