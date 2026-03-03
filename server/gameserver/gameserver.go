package gameserver

import "fmt"

type Dictionary interface {
	IsValid(word string) bool
}

type GameServer struct {
	Dictionary Dictionary
}

func (s *GameServer) HandlePlayerMove(word string) {
	if s.Dictionary.IsValid(word) {
		// TODO: Handle correct word
		fmt.Printf("Ordet finns! \n")
	} else {
		// TODO: Handle non correct words
		fmt.Printf("Ordet finns inte! \n")
	}
}
