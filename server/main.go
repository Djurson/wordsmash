package main

import (
	"api/gameserver"
	"api/routes"
	"api/ws"
	"log"
	"net/http"
)

const WORD_FILE string = "svenska-ord.txt"

func main() {
	wordMap, err := gameserver.HashMapLoadWordsFromTextFile(WORD_FILE)
	if err != nil {
		log.Fatalf("Failed to open file: %s", err)
	}

	server := &gameserver.GameServer{
		Dictionary: wordMap,
	}

	manager := ws.NewManager(server)

	server.HandlePlayerMove("test")
	server.HandlePlayerMove("fuehufheufheuhfe")

	router := routes.DefineRoutes(manager)

	err = http.ListenAndServe(":8080", router)
	if err != nil {
		log.Fatalf("Serverkrasch: %v", err)
	}
}
