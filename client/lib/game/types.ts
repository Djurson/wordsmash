export interface PlacedTile {
  id: string;
  letter: string;
  x: number;
  y: number;
  state: "placed" | "placeholder";
  score: number;
  placedBy?: string;
}

export interface Bomb {
  id: string;
  x: number;
  y: number;
  placedBy: string;
}

export interface Roadblock {
  id: string;
  x: number;
  y: number;
  placedBy: string;
  placedTime: number;
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
  bombs: number;
  roadblocks: number;
};

export type TeamLetter = {
  id: string;
  letter: string;
  isLocked: boolean;
  lockedBy: string;
  score: number;
};

export type GameSettings = {
  timerMinutes: number;
  enableBombs: boolean;
  enableRoadblocks: boolean;
  blockTime: number;
};

export type GameState = {
  board: Record<string, PlacedTile>;
  bombs: Record<string, Bomb>;
  roadblocks: Record<string, Roadblock>;
  team: TeamState;
  gameId: string;
  settings: GameSettings;
  host: string;
  gameStarted: boolean;
  gameOver: boolean;
  endTime: number;
  startTime: number;
  totalScore: number;
  players: Record<string, User>;
};

export type LocalGameState = {
  currentTurnTiles: Record<string, PlacedTile>;
  currentTurnDirection: Direction | null;
  selectedLetterId: string | null;
  currentTurnBombs: Record<string, Bomb>;
};

export type Stat = {
  username: string;
  value: number;
};

export type FinalGameStats = {
  mostPlacedTiles: Stat;
  mostPoints: Stat;
  teamPoints: Record<string, number>;
  winner: Team | "tie";
};
