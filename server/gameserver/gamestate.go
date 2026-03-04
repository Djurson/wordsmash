package gameserver

import "fmt"

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

type GameState struct {
	Board map[string]PlacedTile `json:"board"`
	Bombs map[string]Bomb       `json:"bombs"`
}

func NewGameState() *GameState {
	return &GameState{
		Board: make(map[string]PlacedTile),
		Bombs: make(map[string]Bomb),
	}
}

func getTileKey(x, y int) string {
	return fmt.Sprintf("%d,%d", x, y)
}
