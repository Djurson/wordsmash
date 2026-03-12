package dictionary

// isAllowedWord validates whether a given word meets the game's character rules.
// It returns false if the word is less than 2 characters long or if it contains
// any characters outside of the standard Swedish alphabet (a-z, å, ä, ö).
func isAllowedWord(word string) bool {
	if len(word) < 2 {
		return false
	}

	for _, r := range word {
		if (r >= 'a' && r <= 'z') || r == 'å' || r == 'ä' || r == 'ö' {
			continue
		}
		return false
	}
	return true
}
