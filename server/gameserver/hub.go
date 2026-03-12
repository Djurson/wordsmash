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

// NewHub initializes and returns a new GameHub instance.
// It requires a Dictionary interface for word validation and sets up the necessary channels and maps.
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

// Run starts the hub's main loop.
// It handles client registration, unregistration, broadcasting messages to all clients,
// and periodically logs the status of the server.
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

// generateGameCode generates and returns a random, two-segment alphanumeric room code (e.g., ABCD-1234).
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

// CreateUniqueRoom generates a unique game code, creates a new GameRoom,
// starts its run loop in a goroutine, and returns the generated code.
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

// totalPlayers calculates and returns the aggregate number of clients across all active rooms in the hub.
func (h *GameHub) totalPlayers() int {
	total := 0
	for _, room := range h.Rooms {
		total += len(room.Clients)
	}
	return total
}

// GetRoom retrieves and returns a pointer to the GameRoom associated with the given code.
// It utilizes a read-write mutex to ensure thread safety.
func (h *GameHub) GetRoom(code string) *GameRoom {
	h.RoomsMutex.RLock()
	defer h.RoomsMutex.RUnlock()
	return h.Rooms[code]
}

// DeleteRoom securely removes the GameRoom associated with the given code from the hub's active rooms.
func (h *GameHub) DeleteRoom(code string) {
	h.RoomsMutex.Lock()
	defer h.RoomsMutex.Unlock()

	delete(h.Rooms, code)
	log.Printf("[Hub] Room deleted (code=%s). Open rooms: %d | Players in rooms: %d", code, len(h.Rooms), h.totalPlayers())
}
