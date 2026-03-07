export type WSEventType = "game_created" | "joined_game" | "error" | "lobby_updated" | "game_started" | "board_updated" | "server_connected" | "updated_settings" | "left_room" | "team_letter_updated";

// Sent from the client to go
export type WSSendEventType = "create_game" | "join_game" | "submit_turn" | "update_settings" | "update_username" | "leave_room" | "start_game" | "lock_letter" | "unlock_letter";

export type WSRecievedEvent = {
  type: WSEventType;
  payload: any;
};

export type WSSendEvent = {
  type: WSSendEventType;
  payload: any;
};
