export type WSEventType = "game_created" | "joined_game" | "error" | "lobby_updated" | "game_started" | "board_updated" | "server_connected" | "gamesettings_update";

export type WSEvent = {
  event: WSEventType;
  payload: any;
};

// Payload sent when game_create request is sent
export type CreateGamePayload = {
  username: string;
};

// Payload when join_game request is sent
export type JoinGamePayload = {
  gameCode: string;
  username: string;
};

// Response from the server
export type GameCreatedPayload = {
  gameCode: string;
};
