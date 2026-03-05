export type WSEventType =
  | "game_created" // Go -> React
  | "joined_game" // Go -> React
  | "error" // Go -> React
  | "lobby_updated" // Go -> React
  | "game_started" // Go -> React
  | "board_updated" // Go -> React
  | "server_connected" // Go -> React
  | "updated_settings" // Go -> React
  | "left_room"; // Go -> React (Confirmation)

// Sent from the client to go
export type WSSendEventType = "create_game" | "join_game" | "submit_turn" | "update_settings" | "update_username" | "leave_room" | "start_game";

export type WSRecievedEvent = {
  type: WSEventType;
  payload: any;
};

export type WSSendEvent = {
  type: WSSendEventType;
  payload: any;
};
