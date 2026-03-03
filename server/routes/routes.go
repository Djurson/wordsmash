package routes

import (
	"api/ws"
	"net/http"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

func DefineRoutes(manager *ws.Manager) http.Handler {
	r := mux.NewRouter()

	r.HandleFunc("/ws", manager.ServeWs())
	r.HandleFunc("/test/{word}", TestWord(manager))

	return defineHandlers(r)
}

func defineHandlers(r *mux.Router) http.Handler {
	allowedOrigins := handlers.AllowedOrigins([]string{
		"http://localhost:3000",
		"http://127.0.0.1:3000",
		"http://10.241.236.8:3000",
		"*",
	})

	allowedMethods := handlers.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"})
	allowedHeaders := handlers.AllowedHeaders([]string{"Content-Type", "Authorization"})
	allowCredentials := handlers.AllowCredentials()

	return handlers.CORS(allowedOrigins, allowedMethods, allowedHeaders, allowCredentials)(r)
}

func TestWord(manager *ws.Manager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)

		word := vars["word"]

		if manager.Gameserver.Dictionary.IsValid(word) {
			w.Write([]byte("Word exists"))
		} else {
			w.Write([]byte("Word does not exist"))
		}
	}
}
