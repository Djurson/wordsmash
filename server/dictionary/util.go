package dictionary

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
