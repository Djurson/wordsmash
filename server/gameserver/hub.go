package gameserver

import (
	"fmt"
	"log"
	"math/rand"
	"sync"
	"time"
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
	statusTicker := time.NewTicker(30 * time.Second)
	defer statusTicker.Stop()

	for {
		select {
		// New Client Joins
		case client := <-h.register:
			h.clients[client] = true
			log.Printf("[Hub] Client connected (id=%s). Connected: %d | Rooms open: %d | Players in rooms: %d", client.Id, len(h.clients), len(h.Rooms), h.totalPlayers())

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
				log.Printf("[Hub] Client disconnected (id=%s). Connected: %d | Rooms open: %d | Players in rooms: %d", client.Id, len(h.clients), len(h.Rooms), h.totalPlayers())
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

		// Periodic status log
		case <-statusTicker.C:
			log.Printf("[Hub] Status — Open rooms: %d | Players in rooms: %d | Connected clients: %d", len(h.Rooms), h.totalPlayers(), len(h.clients))
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
			log.Printf("[Hub] Room created (code=%s). Open rooms: %d", code, len(h.Rooms))
			// totalPlayers not counted here — room is empty at creation
			break
		}
	}

	return code
}

func (h *GameHub) totalPlayers() int {
	total := 0
	for _, room := range h.Rooms {
		total += len(room.Clients)
	}
	return total
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
	log.Printf("[Hub] Room deleted (code=%s). Open rooms: %d | Players in rooms: %d", code, len(h.Rooms), h.totalPlayers())
}
