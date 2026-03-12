package routes

import (
	"api/gameserver"
	"net/http"
	"os"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"
)

// DefineRoutes initializes the HTTP router and registers the application's endpoints.
// It sets up the "/ws" endpoint to handle WebSocket upgrades using the provided GameHub,
// and wraps the router in CORS middleware before returning the final http.Handler.
func DefineRoutes(hub *gameserver.GameHub) http.Handler {
	r := mux.NewRouter()

	r.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		gameserver.ServeWs(hub, w, r)
	})
	// r.HandleFunc("/test/{word}", TestWord())

	return defineHandlers(r)
}

// defineHandlers wraps the given router with CORS (Cross-Origin Resource Sharing) middleware.
// It strictly defines the allowed origins (local development and specific frontend URLs),
// allowed HTTP methods, allowed headers, and enables credential support.
// It returns the wrapped http.Handler ready to be served.
func defineHandlers(r *mux.Router) http.Handler {

	allowedOriginValidator := handlers.AllowedOriginValidator(func(origin string) bool {

		// Local development
		if origin == "http://localhost:3000" ||
			origin == "http://127.0.0.1:3000" {
			return true
		}

		if origin == os.Getenv("FRONTEND_URL") || origin == os.Getenv("FRONTEND_GIT_MAIN_URL") {
			return true
		}

		return false
	})

	allowedMethods := handlers.AllowedMethods([]string{
		"GET", "POST", "PUT", "DELETE", "OPTIONS",
	})

	allowedHeaders := handlers.AllowedHeaders([]string{
		"Content-Type",
		"Authorization",
	})

	allowCredentials := handlers.AllowCredentials()

	return handlers.CORS(
		allowedOriginValidator,
		allowedMethods,
		allowedHeaders,
		allowCredentials,
	)(r)
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
