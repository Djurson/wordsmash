package gameserver

import (
	"fmt"
	"math/rand"
	"sync"
)

type Dictionary interface {
	IsValid(word string) bool
	RandomWord() string
}

type GameHub struct {
	clients    map[*Client]bool
	Rooms      map[string]*GameRoom
	RoomsMutex sync.RWMutex
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	Dictionary Dictionary
}

func NewHub(dict Dictionary) *GameHub {
	return &GameHub{
		clients:    make(map[*Client]bool),
		Rooms:      make(map[string]*GameRoom),
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		Dictionary: dict,
	}
}

func (h *GameHub) Run() {
	for {
		select {
		// New Client Joins
		case client := <-h.register:
			h.clients[client] = true

		// Client Disconnects
		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				if client.Room != nil {
					room := client.Room
					client.Room = nil
					go func() { room.Unregister <- client }()
				}
				delete(h.clients, client)
				close(client.send)
			}

		// Send message
		case message := <-h.broadcast:
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					// If there was an error, close the connection
					close(client.send)
					delete(h.clients, client)
				}
			}
		}
	}
}

func generateGameCode() string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

	segment := func() string {
		b := make([]byte, 4)
		for i := range b {
			b[i] = chars[rand.Intn(len(chars))]
		}
		return string(b)
	}

	return fmt.Sprintf("%s-%s", segment(), segment())
}

func (h *GameHub) CreateUniqueRoom() string {
	h.RoomsMutex.Lock()
	defer h.RoomsMutex.Unlock()

	var code string

	for {
		code = generateGameCode()

		if _, exists := h.Rooms[code]; !exists {
			newRoom := NewRoom(code)
			h.Rooms[code] = newRoom

			go newRoom.Run()
			break
		}
	}

	return code
}

func (h *GameHub) GetRoom(code string) *GameRoom {
	h.RoomsMutex.Lock()
	defer h.RoomsMutex.Unlock()
	return h.Rooms[code]
}

func (h *GameHub) DeleteRoom(code string) {
	h.RoomsMutex.Lock()
	defer h.RoomsMutex.Unlock()

	delete(h.Rooms, code)
}

func (s *GameHub) HandlePlayerMove(word string) {
	if s.Dictionary.IsValid(word) {
		// TODO: Handle correct word
		fmt.Printf("Ordet finns! \n")
	} else {
		// TODO: Handle non correct words
		fmt.Printf("Ordet finns inte! \n")
	}
}
