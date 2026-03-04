export interface PlacedTile {
  letter: string;
  x: number;
  y: number;
  team: "a" | "b";
  state: "placed" | "placeholder";
}

export type Direction = "vertical" | "horizontal";

export type WSMessageType = "lobby_join" | "game_code";

export interface Game {
  teams: {
    teamA: { users: User[]; points: number };
    teamB: { users: User[]; points: number };
  };
  gameId: string;
  gamesettings: GameSettings | null;
}

export interface GameSettings {
  timerMinutes: number;
  enableBombs: boolean;
}

export interface User {
  userId: string;
  username: string;
}

export interface Event {
  type: WSMessageType;
  payload: any;
}
