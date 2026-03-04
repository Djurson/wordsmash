"use client";

import { ToastError } from "@/lib/toastfunctions";
import { Event, Game, User, WSMessageType } from "@/lib/types";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";

export interface GameContextContextProps {
  websocket: WebSocket | null;
  sendMessage: (type: WSMessageType, payload: any) => void;
  user: User | null;
  game: Game | null;
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
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`ws://${process.env.NEXT_PUBLIC_WS_PATH}/ws`);

    ws.onopen = () => {
      console.log("Ansluten till servern");
      setWebSocket(ws);
    };

    ws.onerror = () => {
      ToastError("Fel vid anslutning till servern");
    };

    ws.onclose = () => {
      console.log("Anslutning stängd");
      setWebSocket(null);
    };

    ws.onmessage = (event) => {
      const eventData = JSON.parse(event.data);

      switch (eventData.type) {
        case "connection":
          console.log("Connection event:", eventData.payload);
          break;
        case "update":
          console.log("Update event:", eventData.payload);
          break;
        default:
          console.log("Okänd event-typ:", eventData.type);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const sendMessage = (type: WSMessageType, payload: any) => {
    if (!websocket || websocket.readyState !== WebSocket.OPEN) {
      ToastError("Ej ansluten till servern");
      return;
    }

    const event: Event = { type, payload };
    websocket.send(JSON.stringify(event));
  };

  const value: GameContextContextProps = { websocket, user, sendMessage, game: null };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
