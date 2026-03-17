package gameserver

import (
	"encoding/json"
	"fmt"
	"math/rand"
)

// generateGameCode generates and returns a random, two-segment alphanumeric room code (e.g., ABCD-1234).
func generateGameCode() string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

	segment := func() string {
		b := make([]byte, 4)
		for i := range b {
			b[i] = chars[rand.Intn(len(chars))]
		}
		return string(b)
	}

	return fmt.Sprintf("%s-%s", segment(), segment())
}

// PrepareEvent wraps a given payload into an Event structure with the specified EventType.
// It returns the JSON-marshaled byte slice of the final event, ready to be sent over the socket.
func PrepareEvent(eventType EventType, payload any) []byte {
	payloadBytes, _ := json.Marshal(payload)

	updateEvent := Event{
		Type:    eventType,
		Payload: payloadBytes,
	}

	finalMessage, _ := json.Marshal(updateEvent)

	return finalMessage
}

// scoreFromFrequency calculates a letter's score based on its frequency count relative
// to the most common letter (maxCount). Rarer letters return higher scores.
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

func isValidTilesFromHand(newTiles *map[string]PlacedTile, teamState *TeamState, user *User) bool {
	var isValid bool = true

	for _, tile := range *newTiles {
		if _, exists := teamState.Letters[tile.Id]; !exists {
			isValid = false
		}

		if tile.PlacedBy != user.UserId {
			isValid = false
		}
	}

	return isValid
}

func Clamp(value, maxVal int) int {
	if value < maxVal {
		return value
	}

	return maxVal
}
