"use client";

import { GameState, User } from "@/lib/game/types";
import { ToastError, ToastMessage } from "@/lib/toastfunctions";
import { WSEvent, WSEventType } from "@/lib/websocket/WSTypes";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

export interface GameContextContextProps {
  websocket: WebSocket | null;
  sendMessage: (type: WSEventType, payload: any) => void;
  user: User | null;
  gamestate: GameState | null;
}

export const GameContext = createContext<GameContextContextProps | null>(null);

export function useGameContext() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGameContext must be used within a GameContextProvider");
  }
  return context;
}

export function GameContextProvider({ children }: { children: ReactNode }) {
  const [websocket, setWebSocket] = useState<WebSocket | null>(null);
  const [gamestate, setGameState] = useState<GameState | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const updateGameState = useCallback((updates: Partial<GameState>) => {
    setGameState((prev) => {
      if (!prev) return updates as GameState;
      return { ...prev, ...updates };
    });
  }, []);

  useEffect(() => {
    const ws = new WebSocket(`ws://${process.env.NEXT_PUBLIC_WS_PATH}/ws`);

    ws.onopen = () => {
      console.log("Ansluten till servern");
      setWebSocket(ws);
    };

    ws.onerror = () => {
      ToastError("Fel med anslutning till servern");
    };

    ws.onclose = () => {
      console.log("Anslutning stängd");
      setWebSocket(null);
    };

    ws.onmessage = (event) => {
      const parsedEvent = JSON.parse(event.data) as WSEvent;
      onIncomingMessage(parsedEvent);
    };

    return () => {
      ws.close();
    };
  }, []);

  function handleGameCreatedOrJoined(payload: any) {
    const user: User = payload.user;
    setUser(user);

    const gamestate: GameState = payload.gameState;
    setGameState(gamestate);

    const message: string = payload.message;
    ToastMessage(message);
  }

  function onIncomingMessage(event: WSEvent) {
    switch (event.event) {
      case "game_created":
        handleGameCreatedOrJoined(event.payload);
        break;

      case "joined_game":
        handleGameCreatedOrJoined(event.payload);
        break;

      case "board_updated":
        break;

      case "error":
        break;

      case "game_started":
        break;

      case "gamesettings_update":
        break;

      case "lobby_updated":
        break;

      case "server_connected":
        break;

      default:
        break;
    }
  }

  const sendMessage = (event: WSEventType, payload: any) => {
    if (!websocket || websocket.readyState !== WebSocket.OPEN) {
      ToastError("Ej ansluten till servern");
      return;
    }

    const final: WSEvent = { event, payload };
    websocket.send(JSON.stringify(final));
  };

  const value: GameContextContextProps = { websocket, user, sendMessage, gamestate };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
