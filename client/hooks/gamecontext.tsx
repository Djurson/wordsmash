"use client";

import { GameState, LocalGameState, PlacedTile, TeamLetter, User } from "@/lib/game/types";
import { finalTesting, getTileKey, isValidPlacement } from "@/lib/game/utils";
import { ToastError, ToastSucess } from "@/lib/toastfunctions";
import { WSRecievedEvent, WSSendEventType, WSSendPayloadMap } from "@/lib/websocket/WSTypes";
import { useRouter } from "next/navigation";
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

export type SendMessageType = <T extends WSSendEventType>(type: T, payload: WSSendPayloadMap[T]) => void;

export interface GameContextContextProps {
  isConnected: boolean;
  sendMessage: SendMessageType;
  user: User | null;
  gamestate: GameState | null;
  leaveRoom: () => void;
  connectionError: boolean;
  localGameState: LocalGameState;
  updateLocalGameState: (updates: Partial<LocalGameState>) => void;
  handleSelectLetter: (key: string | null) => void;
  handleCancelPlacement: () => void;
  handleSubmitPlacement: () => void;
  handlePlaceTile: (x: number, y: number) => void;
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

  const [localGameState, setLocalGameState] = useState<LocalGameState>({
    currentTurnTiles: {},
    currentTurnBombs: {},
    currentTurnDirection: null,
    selectedLetterId: null,
  });

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
    const url = process.env.NEXT_PUBLIC_WS_PATH ? `wss://${process.env.NEXT_PUBLIC_WS_PATH}/ws` : `ws://${process.env.NEXT_PUBLIC_LOCAL_WS_PATH}/ws`;
    const ws = new WebSocket(url);

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
          updateGameState(payload);
          break;

        case "board_updated":
          const newBoard = payload.board;
          updateGameState({ board: newBoard });
          setLocalGameState((prevLocal) => {
            let collision = false;

            // Loop through the local placeholders
            for (const key in prevLocal.currentTurnTiles) {
              // Is there collision?
              if (newBoard[key]) {
                collision = true;
                break;
              }
            }

            if (collision) {
              ToastError("Någon hann före! Dina brickor rensades.");
              return { currentTurnTiles: {}, currentTurnDirection: null, selectedLetterId: null, currentTurnBombs: prevLocal.currentTurnBombs };
            }

            return prevLocal;
          });
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
            currentTurnBombs: {},
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
  }, [updateGameState, router]);

  const sendMessage: SendMessageType = useCallback(
    (type, payload) => {
      if (!websocket || websocket.readyState !== WebSocket.OPEN) {
        ToastError("Ej ansluten till servern");
        return;
      }
      const event = { type, payload };
      websocket.send(JSON.stringify(event));
    },
    [websocket],
  );

  const leaveRoom = () => {
    sendMessage("leave_room", null);
  };

  const handleSelectLetter = useCallback(
    (key: string | null) => {
      if (!gamestate) return;
      const newSelected = localGameState.selectedLetterId === key ? null : key;

      if (newSelected && gamestate.team.teamLetters[newSelected].isLocked) return;

      updateLocalGameState({ selectedLetterId: newSelected });
    },
    [gamestate, localGameState, updateLocalGameState],
  );

  const handleCancelPlacement = useCallback(() => {
    if (localGameState.selectedLetterId !== null) {
      handleSelectLetter(null);
      return;
    }

    sendMessage("unlock_letter", null);
    updateLocalGameState({ selectedLetterId: null, currentTurnDirection: null, currentTurnTiles: {} });
  }, [localGameState, handleSelectLetter, sendMessage, updateLocalGameState]);

  const handleSubmitPlacement = useCallback(() => {
    if (Object.keys(localGameState.currentTurnTiles).length === 0 || !gamestate) return;

    const result = finalTesting(localGameState, gamestate);

    if (result === "failed") return;

    sendMessage("submit_turn", { newTiles: localGameState.currentTurnTiles, newBombs: localGameState.currentTurnBombs });
    updateLocalGameState({ currentTurnBombs: {}, currentTurnTiles: {}, selectedLetterId: null, currentTurnDirection: null });
  }, [localGameState, gamestate, sendMessage, updateLocalGameState]);

  const handlePlaceTile = useCallback(
    (x: number, y: number) => {
      if (localGameState.selectedLetterId === null || gamestate === null) return;

      const validationResult = isValidPlacement(x, y, localGameState.currentTurnDirection, gamestate.board, localGameState.currentTurnTiles);
      if (validationResult === false) return;

      const targetKey = getTileKey(x, y);
      const letter = gamestate.team.teamLetters[localGameState.selectedLetterId];
      const newTile: PlacedTile = { letter: letter.letter, x, y, state: "placeholder", score: letter.score, Id: letter.id };
      const updatedTurnTiles = { ...localGameState.currentTurnTiles, [targetKey]: newTile };

      updateLocalGameState({ currentTurnDirection: validationResult, selectedLetterId: null, currentTurnTiles: updatedTurnTiles });
      sendMessage("lock_letter", { letterId: localGameState.selectedLetterId, placement: updatedTurnTiles });
    },
    [localGameState, gamestate, sendMessage, updateLocalGameState],
  );

  const value: GameContextContextProps = {
    isConnected,
    user,
    gamestate,
    sendMessage,
    leaveRoom,
    connectionError,
    localGameState,
    updateLocalGameState,
    handleSelectLetter,
    handleCancelPlacement,
    handleSubmitPlacement,
    handlePlaceTile,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
