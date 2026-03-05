package gameserver

import (
	"bufio"
	"fmt"
	"math/rand"
	"os"
	"strings"
)

type HashMapDictionary struct {
	words    map[string]struct{}
	wordList []string
}

func (h *HashMapDictionary) RandomWord() string {
	if len(h.wordList) == 0 {
		return ""
	}

	randomIndex := rand.Intn(len(h.wordList))

	return h.wordList[randomIndex]
}

func (h *HashMapDictionary) IsValid(word string) bool {
	word = strings.ToLower(word)
	_, exists := h.words[word]
	return exists
}

func HashMapLoadWordsFromTextFile(filename string) (*HashMapDictionary, error) {
	hashmapDict := HashMapDictionary{
		words:    make(map[string]struct{}),
		wordList: make([]string, 0),
	}

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
		hashmapDict.wordList = append(hashmapDict.wordList, line)
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("error reading file stream: %w", err)
	}

	return &hashmapDict, nil
}
