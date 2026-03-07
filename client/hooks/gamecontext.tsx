"use client";

import { GameState, LocalGameState, PlacedTile, Team, TeamLetter, User } from "@/lib/game/types";
import { ToastError, ToastSucess } from "@/lib/toastfunctions";
import { WSRecievedEvent, WSSendEvent, WSSendEventType } from "@/lib/websocket/WSTypes";
import { useRouter } from "next/navigation";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

export interface GameContextContextProps {
  isConnected: boolean;
  sendMessage: (type: WSSendEventType, payload: any) => void;
  user: User | null;
  gamestate: GameState | null;
  leaveRoom: () => void;
  connectionError: boolean;
  localGameState: LocalGameState;
  updateLocalGameState: (updates: Partial<LocalGameState>) => void;
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
  const router = useRouter();
  const [websocket, setWebSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gamestate, setGameState] = useState<GameState | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [connectionError, setConnectionError] = useState<boolean>(false);

  const [localGameState, setLocalGameState] = useState<LocalGameState>({ currentTurnTiles: {}, currentTurnDirection: null, selectedLetterId: null });

  const updateGameState = useCallback((updates: Partial<GameState>) => {
    setGameState((prev) => {
      if (!prev) return updates as GameState;
      return { ...prev, ...updates };
    });
  }, []);

  const updateLocalGameState = useCallback((updates: Partial<LocalGameState>) => {
    setLocalGameState((prev) => {
      if (!prev) return updates as LocalGameState;
      return { ...prev, ...updates };
    });
  }, []);

  function reset() {
    setWebSocket(null);
    setIsConnected(false);
    setGameState(null);
    setUser(null);
  }

  useEffect(() => {
    const ws = new WebSocket(`ws://${process.env.NEXT_PUBLIC_WS_PATH}/ws`);

    ws.onopen = () => {
      setWebSocket(ws);
      setIsConnected(true);
    };

    ws.onerror = () => {
      setIsConnected(false);
      ToastError("Fel med anslutning till servern");
      setConnectionError(true);
    };

    ws.onclose = () => {
      reset();
    };

    ws.onmessage = (event) => {
      const parsedEvent = JSON.parse(event.data) as WSRecievedEvent;
      const { type, payload } = parsedEvent;
      switch (type) {
        case "game_created":
        case "joined_game":
          setUser(payload.user);
          setGameState(payload.gamestate);
          ToastSucess(payload.message);
          break;

        case "lobby_updated":
          // The whole gamestate is sent from the server when the lobby is updated
          updateGameState(payload);
          break;

        case "board_updated":
          console.log("board_updated:", payload);
          // The server only sends the board
          updateGameState({ board: payload });
          break;

        case "error":
          console.log("error", payload);
          ToastError(payload.message);
          break;

        case "server_connected":
          ToastSucess(payload.message);
          break;

        case "updated_settings":
          updateGameState({ settings: payload });
          break;

        case "game_started":
          updateGameState(payload);
          setLocalGameState({
            currentTurnTiles: {},
            currentTurnDirection: null,
            selectedLetterId: null,
          });
          router.push("/game");
          break;

        case "left_room":
          ToastError(payload.message);
          setGameState(null);
          break;

        case "team_letter_updated":
          const letters: Record<string, TeamLetter> = payload.teamLetters;
          const placeholders: Record<string, PlacedTile> = payload.placeholders;
          setGameState((prev) => {
            if (!prev) return prev;
            return {
              ...prev /* Copy board, bombs, timeLeft etc. */,
              team: {
                ...prev.team /* score */,
                teamLetters: letters,
                placeholders: placeholders,
              },
            };
          });
          break;

        default:
          console.log("Ohanterat event från server:", type);
          break;
      }
    };

    return () => ws.close();
  }, [updateGameState]);

  const sendMessage = useCallback(
    (type: WSSendEventType, payload: any) => {
      if (!websocket || websocket.readyState !== WebSocket.OPEN) {
        ToastError("Ej ansluten till servern");
        return;
      }
      const event: WSSendEvent = { type, payload };
      websocket.send(JSON.stringify(event));
    },
    [websocket],
  );

  const leaveRoom = () => {
    sendMessage("leave_room", {});
  };

  const value: GameContextContextProps = { isConnected, user, gamestate, sendMessage, leaveRoom, connectionError, localGameState, updateLocalGameState };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
