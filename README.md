# WordSmash

WordSmash is a real-time, team-based multiplayer word game inspired by classics like Scrabble and Wordfeud, but built for collaborative team play. Players join a lobby, split into two teams (Team A and Team B), and compete by placing letters on an interactive, zoomable canvas.

The game features lightning-fast synchronization, instant word validation against a Swedish dictionary, and dynamic scoring based on actual letter frequencies.

## Acknowledgments

- **Swedish Dictionary:** The exhaustive list of Swedish words (`svenska-ord.txt`) used for server-side validation and dynamic letter scoring is sourced from the excellent [dqvist12/alla-svenska-ord](https://github.com/dqvist12/alla-svenska-ord) repository.

## Features

- **Real-Time Multiplayer:** Powered by WebSockets for instant, low-latency updates across all connected clients.
- **Team-Based Gameplay:** Work together with your teammates using a shared pool of letters. See your teammates' drafted words in real-time before they submit them.
- **Interactive Canvas:** A fully interactive, zoomable, and pannable game board with drag-and-drop or click-to-place tile mechanics.
- **Optimistic UI:** Fluid and snappy frontend experience. The client predicts server responses for placing tiles, making the game feel instantaneous.
- **Dynamic Letter Bag:** Tile distribution and scoring are mathematically calculated on server startup based on the actual letter frequencies found in the dictionary.
- **Smart Server Validation:** Strict backend validation prevents cheating. The server automatically extracts words, checks for invalid gaps, resolves race conditions (when players try to play on the same tile), and validates words against the dictionary.

## Tech Stack

### Frontend (`/client`)

- **Framework:** [Next.js](https://nextjs.org/) (React)
- **Language:** TypeScript
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **State Management:** React Context API with Custom Hooks (`useGameContext`)

### Backend (`/server`)

- **Language:** Go
- **WebSockets:** [Gorilla WebSocket](https://github.com/gorilla/websocket)
- **Routing:** [Gorilla Mux](https://github.com/gorilla/mux)
- **Architecture:** Thread-safe, channel-based room management with targeted broadcasting.

## Repository Structure

```text
wordsmash/
├── client/                 # Next.js Frontend
│   ├── app/                # Next.js App Router pages
│   ├── components/         # UI components (Canvas, Player Dock, Lobby)
│   ├── hooks/              # GameState and WebSocket context
│   └── lib/                # Types, Game Logic, and Validation Utils
└── server/                 # Go Game Server
    ├── dictionary/         # Dictionary loading and word frequency logic
    ├── gameserver/         # Core game logic (Hub, Room, GameState, Events)
    ├── routes/             # HTTP & WebSocket routing
    └── svenska-ord.txt     # Swedish dictionary text file
```

## Getting Started

### Prerequisites

- [Node.js (v18+)](https://nodejs.org/en)
- [Go (v1.21+)](https://go.dev/)

### 1. Start the Backend Server

Navigate to the `server` directory, resolve dependencies, and start the Go server:

```bash
cd server
go mod tidy
go run main.go
```

_The WebSocket server will start on `http://localhost:8080`._

### 2. Start the Frontend Client

Open a new terminal, navigate to the `client` directory, install dependencies, and start the development server:

```bash
cd client
npm install
npm run dev
```

The web client will be available at `http://localhost:3000`.

## How to Play

1. Open the app and enter a username.
2. **Create a Game** to generate a unique room code, or **Join a Game** using an existing code.
3. Players are automatically distributed into Team A or Team B.
4. The host sets the timer and starts the game.
5. Select a letter from your player dock and click on the board to place a placeholder.
6. Once your word is complete, hit Submit. The server will validate the word, award points, and deal replacement letters!

[Swedish Words](https://github.com/dqvist12/alla-svenska-ord/blob/main/svenska-ord.txt)
