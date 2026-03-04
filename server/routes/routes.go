package routes

import (
	"api/gameserver"
	"net/http"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

func DefineRoutes(hub *gameserver.GameHub) http.Handler {
	r := mux.NewRouter()

	r.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		gameserver.ServeWs(hub, w, r)
	})
	// r.HandleFunc("/test/{word}", TestWord())

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

// func TestWord() http.HandlerFunc {
// 	return func(w http.ResponseWriter, r *http.Request) {
// 		vars := mux.Vars(r)

// 		word := vars["word"]

// 		if .Dictionary.IsValid(word) {
// 			w.Write([]byte("Word exists"))
// 		} else {
// 			w.Write([]byte("Word does not exist"))
// 		}
// 	}
// }
