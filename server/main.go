package main

import (
	"api/gameserver"
	"api/routes"
	"fmt"
	"log"
	"net/http"
)

const WORD_FILE string = "svenska-ord.txt"

func main() {
	wordMap, err := gameserver.HashMapLoadWordsFromTextFile(WORD_FILE)
	if err != nil {
		log.Fatalf("Failed to open file: %s", err)
	}

	hub := gameserver.NewHub(wordMap)

	// server.HandlePlayerMove("test")
	// server.HandlePlayerMove("fuehufheufheuhfe")

	go hub.Run()

	router := routes.DefineRoutes(hub)

	fmt.Print("Starting server on: 8080")
	log.Fatal(http.ListenAndServe(":8080", router))
}
