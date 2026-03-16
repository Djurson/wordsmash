import { Bomb, FinalGameStats, GameSettings, GameState, PlacedTile, TeamLetter, User } from "../game/types";

/* RECIEVED FROM THE BACkEND */
export type WSRecievedEvent =
  | { type: "game_created" | "joined_game"; payload: { gamestate: GameState; user: User; message: string } }
  | { type: "lobby_updated" | "board_updated" | "game_started"; payload: GameState }
  | { type: "game_over"; payload: FinalGameStats }
  | { type: "updated_settings"; payload: GameSettings }
  | { type: "error" | "server_connected" | "left_room"; payload: { message: string } }
  | { type: "team_letter_updated"; payload: { teamLetters: Record<string, TeamLetter>; placeholders: Record<string, PlacedTile> } }
  | { type: "bomb_exploded"; payload: { x: number; y: number; message: string; bad: boolean } };

export type WSEventType = WSRecievedEvent["type"];

/* SENT TO THE BACKEND */
export type WSSendPayloadMap = {
  create_game: { username: string; settings: GameSettings };
  join_game: { gameCode: string; username: string };
  update_username: { username: string };
  update_settings: GameSettings;
  lock_letter: { letterId: string; placement: Record<string, PlacedTile> };
  submit_turn: { newTiles: Record<string, PlacedTile> };
  submit_bomb: { x: number; y: number };
  submit_roadblock: { x: number; y: number };
  leave_room: null;
  start_game: null;
  unlock_single_letter: { letterId: string; tileKey: string };
  unlock_letter: null;
  submit_trade_in: { letterIds: string[] };
};

export type WSSendEventType = keyof WSSendPayloadMap;

export type WSSendEvent = {
  [K in WSSendEventType]: { type: K; payload: WSSendPayloadMap[K] };
}[WSSendEventType];
