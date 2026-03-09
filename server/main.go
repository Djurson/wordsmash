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

	fmt.Println(os.Getenv("FRONTEND_URL"))
	fmt.Println(os.Getenv("FRONTEND_GIT_MAIN_URL"))
	// server.HandlePlayerMove("test")
	// server.HandlePlayerMove("fuehufheufheuhfe")

	go hub.Run()

	router := routes.DefineRoutes(hub)

	fmt.Print("Starting server on: 8080 \n")
	log.Fatal(http.ListenAndServe(":8080", router))
}
