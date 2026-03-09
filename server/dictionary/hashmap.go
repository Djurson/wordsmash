package dictionary

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

func (h *HashMapDictionary) GetWordList() []string {
	return h.wordList
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

func CalculateLetterFrequency(words []string) map[rune]int {
	freq := make(map[rune]int)

	for _, word := range words {
		for _, r := range word {
			freq[r]++
		}
	}

	return freq
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

		if !isAllowedWord(line) {
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
