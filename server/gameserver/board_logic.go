package gameserver

import (
	"fmt"
	"math"
	"sort"
)

// getTileKey formats the given x and y coordinates into a comma-separated string,
// which is used as the unique key in the board maps.
func getTileKey(x, y int) string {
	return fmt.Sprintf("%d,%d", x, y)
}

// isValidPlacement checks if the tiles in a SubmitTurnAction form a valid move.
// It verifies overlaps with placed tiles or roadblocks, checks for adjacency to existing tiles,
// and ensures the placement forms a straight, continuous line.
// It returns a boolean indicating success and an error message if the placement is invalid.
func isValidPlacement(turnAction *SubmitTurnAction, board *map[string]PlacedTile, roadblocks *map[string]Roadblock) (bool, string) {
	if len(turnAction.NewTiles) == 0 {
		return false, "Behöver placera ut minst en bricka"
	}

	hasPlacedNeighbor := false
	var xs []int
	var ys []int

	for key, tile := range turnAction.NewTiles {
		// Check overlap with already placed tiles
		if _, exists := (*board)[key]; exists {
			return false, "En av rutorna är redan upptagen på brädet"
		}

		if _, exists := (*roadblocks)[key]; exists {
			return false, "En av rutorna är upptagen av en spärr"
		}

		// Does the key match the coordinates
		if key != getTileKey(tile.X, tile.Y) {
			return false, "Ogiltig data: Koordinaterna stämmer inte överens"
		}

		xs = append(xs, tile.X)
		ys = append(ys, tile.Y)

		// Does the tile touch any placed brackets
		if checkTileNeighbors(tile.X, tile.Y, board) {
			hasPlacedNeighbor = true
		}
	}

	if !hasPlacedNeighbor {
		return false, "Ditt ord måste sitta ihop med de befintliga brickorna på brädet"
	}

	// Direction checking
	if len(turnAction.NewTiles) > 1 {
		isHorizontal := true
		isVertical := true

		firstX, firstY := xs[0], ys[0]

		// Check if they share the same row or column
		for i := 1; i < len(xs); i++ {
			if xs[i] != firstX {
				isVertical = false
			}
			if ys[i] != firstY {
				isHorizontal = false
			}
		}

		if !isHorizontal && !isVertical {
			return false, "Brickorna måste ligga på en rak horisontell eller vertikal linje"
		}

		// We combine the boards just for the gap check so we can look at it as one single layer
		fullBoardForGapCheck := combineBoards(&turnAction.NewTiles, board)

		if isHorizontal {
			sort.Ints(xs)
			for x := xs[0]; x <= xs[len(xs)-1]; x++ {
				if _, exists := fullBoardForGapCheck[getTileKey(x, firstY)]; !exists {
					return false, "Det finns luckor i ditt ord. Brickorna måste sitta ihop"
				}
			}
		} else if isVertical {
			sort.Ints(ys)
			for y := ys[0]; y <= ys[len(ys)-1]; y++ {
				if _, exists := fullBoardForGapCheck[getTileKey(firstX, y)]; !exists {
					return false, "Det finns luckor i ditt ord. Brickorna måste sitta ihop"
				}
			}
		}
	}

	return true, ""
}

// checkTileNeighbors checks if the given x and y coordinates have any directly adjacent tiles on the board.
// It returns true if at least one orthogonal neighbor exists.
func checkTileNeighbors(x int, y int, board *map[string]PlacedTile) bool {
	neighborsKeys := []string{
		getTileKey(x+1, y),
		getTileKey(x-1, y),
		getTileKey(x, y+1),
		getTileKey(x, y-1),
	}

	for _, key := range neighborsKeys {
		if _, exists := (*board)[key]; exists {
			return true
		}
	}

	return false
}

// extractWordsAndScore analyzes the newly placed tiles in conjunction with the existing board.
// It identifies all newly formed horizontal and vertical words and calculates the total score for the turn.
func extractWordsAndScore(newTiles *map[string]PlacedTile, board *map[string]PlacedTile) ([]string, int) {
	var words []string
	totalScore := 0

	fullBoard := combineBoards(newTiles, board)
	firstPlacedTile, isHorizontal := getPlacementDetails(newTiles)

	// Extract the main word
	mainWord, mainScore := extractWordAt(firstPlacedTile.X, firstPlacedTile.Y, isHorizontal, &fullBoard)
	if len(mainWord) > 1 {
		words = append(words, mainWord)
		totalScore += mainScore
	}

	// Extract cross words
	for _, tile := range *newTiles {
		crossWord, crossScore := extractWordAt(tile.X, tile.Y, !isHorizontal, &fullBoard)
		if len(crossWord) > 1 {
			words = append(words, crossWord)
			totalScore += crossScore
		}
	}

	return words, totalScore
}

// extractWordAt traverses the full board from the given startX and startY coordinates in either a
// horizontal or vertical direction. It returns the full connected word string and its accumulated score.
func extractWordAt(startX, startY int, horizontal bool, fullBoard *map[string]PlacedTile) (string, int) {
	wordTiles := getWordTiles(startX, startY, horizontal, fullBoard)

	word := ""
	score := 0
	length := len(wordTiles)

	for _, tile := range wordTiles {
		word += tile.Letter
		score += tile.Score
	}

	// Apply length multiplier
	if length >= 3 {
		score = int(float64(score) * math.Pow(1.2, float64(length-2)))
	}

	return word, score
}

// wordContainsBomb checks if any of the new tiles are placed on top of active bombs.
// It returns a boolean flag and a string message.
func wordContainsBomb(newTiles *map[string]PlacedTile, placedTiles *map[string]PlacedTile, bombs *map[string]Bomb) (bool, string) {
	if len(*bombs) == 0 {
		return false, ""
	}

	fullBoard := combineBoards(newTiles, placedTiles)
	firstTile, isHorizontal := getPlacementDetails(newTiles)

	// Simplified inner helper using getWordTiles
	checkLineForBomb := func(startX, startY int, checkHorizontal bool) (bool, string) {
		wordTiles := getWordTiles(startX, startY, checkHorizontal, &fullBoard)

		for _, tile := range wordTiles {
			key := getTileKey(tile.X, tile.Y)
			if _, isBomb := (*bombs)[key]; isBomb {
				return true, fmt.Sprintf("Du använde en bricka med en bomb på (%d, %d)!", tile.X, tile.Y)
			}
		}
		return false, ""
	}

	// Check the main word line
	if hasBomb, msg := checkLineForBomb(firstTile.X, firstTile.Y, isHorizontal); hasBomb {
		return true, msg
	}

	// Check all perpendicular cross-words formed by each new tile
	for _, tile := range *newTiles {
		if hasBomb, msg := checkLineForBomb(tile.X, tile.Y, !isHorizontal); hasBomb {
			return true, msg
		}
	}

	return false, ""
}

// getPlacementDetails analyzes the new tiles to determine the first placed tile
// and whether the tiles were placed in a horizontal line.
func getPlacementDetails(newTiles *map[string]PlacedTile) (firstTile PlacedTile, isHorizontal bool) {
	for _, t := range *newTiles {
		firstTile = t
		break
	}

	isHorizontal = true
	for _, t := range *newTiles {
		if t.Y != firstTile.Y {
			isHorizontal = false
			break
		}
	}

	// Single tile placements default to horizontal for the primary word check
	if len(*newTiles) == 1 {
		isHorizontal = true
	}

	return firstTile, isHorizontal
}

// getWordTiles traverses the board from a starting coordinate to find the full continuous line
// of tiles (either horizontally or vertically). It returns a slice of all PlacedTiles in that word.
func getWordTiles(startX, startY int, isHorizontal bool, fullBoard *map[string]PlacedTile) []PlacedTile {
	x, y := startX, startY

	// Walk backwards to the beginning of the word
	for {
		prevX, prevY := x, y
		if isHorizontal {
			prevX--
		} else {
			prevY--
		}

		if _, exists := (*fullBoard)[getTileKey(prevX, prevY)]; !exists {
			break
		}
		x, y = prevX, prevY
	}

	// Walk forward and collect all tiles in the word
	var tiles []PlacedTile
	for {
		key := getTileKey(x, y)
		tile, exists := (*fullBoard)[key]
		if !exists {
			break
		}

		tiles = append(tiles, tile)

		if isHorizontal {
			x++
		} else {
			y++
		}
	}

	return tiles
}

// combineBoards merges the newly placed tiles with the existing board tiles
// to create a unified view of the board for word traversal and validation.
func combineBoards(newTiles, board *map[string]PlacedTile) map[string]PlacedTile {
	fullBoard := make(map[string]PlacedTile)
	for k, v := range *board {
		fullBoard[k] = v
	}
	for k, v := range *newTiles {
		fullBoard[k] = v
	}
	return fullBoard
}
