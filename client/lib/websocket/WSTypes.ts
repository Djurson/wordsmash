import { Bomb, GameSettings, GameState, PlacedTile, TeamLetter, User } from "../game/types";

/* SENT FROM THE BACkEND TO NEXT */
export type WSRecievedEvent =
  | { type: "game_created" | "joined_game"; payload: { gamestate: GameState; user: User; message: string } }
  | { type: "lobby_updated" | "board_updated" | "game_started"; payload: GameState }
  | { type: "updated_settings"; payload: GameSettings }
  | { type: "error" | "server_connected" | "left_room"; payload: { message: string } }
  | { type: "team_letter_updated"; payload: { teamLetters: Record<string, TeamLetter>; placeholders: Record<string, PlacedTile> } };

export type WSEventType = WSRecievedEvent["type"];

/* SENT FROM REACT TO THE BACKEND */
export type WSSendEvent =
  | { type: "create_game"; payload: { username: string; settings: GameSettings } }
  | { type: "join_game"; payload: { gameCode: string; username: string } }
  | { type: "update_username"; payload: { username: string } }
  | { type: "update_settings"; payload: GameSettings }
  | { type: "lock_letter"; payload: { letterId: string; placement: Record<string, PlacedTile> } }
  | { type: "submit_turn"; payload: { newTiles: Record<string, PlacedTile>; newBombs: Record<string, Bomb> } }
  | { type: "leave_room" | "start_game" | "unlock_letter"; payload: Record<string, never> };

export type WSSendEventType = WSSendEvent["type"];
