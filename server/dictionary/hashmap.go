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

// GetWordList returns the complete slice of valid words loaded into the dictionary.
func (h *HashMapDictionary) GetWordList() []string {
	return h.wordList
}

// RandomWord selects and returns a random valid word from the dictionary.
// It loops until it finds a word that is strictly longer than 4 characters.
// If the dictionary is empty, it returns an empty string.
func (h *HashMapDictionary) RandomWord() string {

	var word string

	for {
		if len(h.wordList) == 0 {
			return ""
		}

		randomIndex := rand.Intn(len(h.wordList))

		word = h.wordList[randomIndex]

		if len(word) > 4 {
			break
		}
	}

	return word
}

// IsValid checks if the provided word exists in the dictionary.
// It converts the input string to lowercase before performing a fast map lookup.
// It returns true if the word is found, and false otherwise.
func (h *HashMapDictionary) IsValid(word string) bool {
	word = strings.ToLower(word)
	_, exists := h.words[word]
	return exists
}

// CalculateLetterFrequency analyzes a slice of words and counts the occurrences of each letter.
// It returns a map where the key is the rune (letter) and the value is its total frequency.
func CalculateLetterFrequency(words []string) map[rune]int {
	freq := make(map[rune]int)

	for _, word := range words {
		for _, r := range word {
			freq[r]++
		}
	}

	return freq
}

// HashMapLoadWordsFromTextFile reads a given text file line by line to build a new HashMapDictionary.
// It trims whitespace, converts text to lowercase, and filters out invalid words using isAllowedWord.
// It returns a pointer to the populated dictionary and any error encountered during file reading.
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
