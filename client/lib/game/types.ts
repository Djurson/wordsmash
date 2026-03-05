export interface PlacedTile {
  letter: string;
  x: number;
  y: number;
  team: "a" | "b";
  state: "placed" | "placeholder";
}

export interface Bomb {
  x: number;
  y: number;
  placedBy: string;
}

export type Direction = "vertical" | "horizontal";

export type Team = "a" | "b";

export type User = {
  username: string;
  userId: string;
  team: string;
};

export type TeamState = {
  score: number;
  letter: string[];
  players: Record<string, User>;
};

export type GameState = {
  board: Record<string, PlacedTile>;
  bombs: Record<string, Bomb>;
  teams: Record<Team, TeamState>;
  timeLeft: number;
  gameId: string;
};
