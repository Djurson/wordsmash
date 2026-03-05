package gameserver

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

type HashMapDictionary struct {
	words map[string]struct{}
}

func (h *HashMapDictionary) IsValid(word string) bool {
	word = strings.ToLower(word)
	_, exists := h.words[word]
	return exists
}

func HashMapLoadWordsFromTextFile(filename string) (*HashMapDictionary, error) {
	hashmapDict := HashMapDictionary{words: make(map[string]struct{})}
	file, err := os.Open(filename)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	// Read the file line by line
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()

		line = strings.TrimSpace(line)
		line = strings.ToLower(line)

		if strings.Contains(line, "-") || len(line) < 2 {
			continue
		}

		hashmapDict.words[line] = struct{}{}
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("error reading file stream: %w", err)
	}

	return &hashmapDict, nil
}
