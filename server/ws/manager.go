package ws

import (
	"api/gameserver"
	"net/http"

	"github.com/gorilla/websocket"
)

type Manager struct {
	Gameserver gameserver.GameServer
}

var (
	websocketUpgrader = websocket.Upgrader{
		CheckOrigin:     checkOrigin,
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
	}
)

func NewManager(gameserver *gameserver.GameServer) *Manager {
	m := &Manager{
		Gameserver: *gameserver,
	}

	return m
}

func checkOrigin(r *http.Request) bool {
	origin := r.Header.Get("Origin")

	switch origin {
	case "http://localhost:3000":
		return true
	case "http://10.241.236.8:3000":
		return true
	case "http://127.0.0.1:3000":
		return true
	default:
		return false
	}
}

func (manager *Manager) ServeWs() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// TODO: Implement this
	}
}
