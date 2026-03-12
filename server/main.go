package main

import (
	"api/dictionary"
	"api/gameserver"
	"api/routes"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
)

const WORD_FILE string = "svenska-ord.txt"

// main is the entry point for the backend server.
// It loads environment variables, initializes the Swedish dictionary, calculates
// letter frequencies to populate the game's letter bag, sets up the central GameHub,
// configures the HTTP/WebSocket routes, and starts the web server.
func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found")
	}

	value := os.Getenv("KEY")
	log.Println(value)

	wordMap, err := dictionary.HashMapLoadWordsFromTextFile(WORD_FILE)
	if err != nil {
		log.Fatalf("Failed to open file: %v", err)
	}

	freq := dictionary.CalculateLetterFrequency(wordMap.GetWordList())
	gameserver.InitLetterBag(freq)

	hub := gameserver.NewHub(wordMap)

	go hub.Run()

	router := routes.DefineRoutes(hub)

	fmt.Print("Starting server on: 8080 \n")
	log.Fatal(http.ListenAndServe(":8080", router))
}
