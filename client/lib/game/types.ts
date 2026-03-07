export interface PlacedTile {
  letter: string;
  x: number;
  y: number;
  state: "placed" | "placeholder";
  placedBy?: string;
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
  team: Team;
};

export type TeamState = {
  score: number;
  teamLetters: Record<string, TeamLetter>;
  placeholders: Record<string, PlacedTile>;
};

export type TeamLetter = {
  id: string;
  letter: string;
  isLocked: boolean;
  lockedBy: string;
};

export type GameSettings = {
  timerMinutes: number;
  enableBombs: boolean;
};

export type GameState = {
  board: Record<string, PlacedTile>;
  bombs: Record<string, Bomb>;
  team: TeamState;
  gameId: string;
  settings: GameSettings;
  host: string;
  gameStarted: boolean;
  endTime: number;
  totalScore: number;
  players: Record<string, User>;
};

export type LocalGameState = {
  currentTurnTiles: Record<string, PlacedTile>;
  currentTurnDirection: Direction | null;
  selectedLetterId: string | null;
};
