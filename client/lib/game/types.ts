export type PlacedTile = {
  id: string;
  letter: string;
  x: number;
  y: number;
  state: "placed" | "placeholder";
  score: number;
  placedBy?: string;
};

export type Bomb = {
  placedBy: string;
  x: number;
  y: number;
  team: Team;
};

export type Explosion = {
  id: string;
  x: number;
  y: number;
};

export type Roadblock = {
  placedBy: string;
  x: number;
  y: number;
  expiresAt: number;
};

export type Direction = "vertical" | "horizontal";
export type Team = "a" | "b";

export type User = {
  username: string;
  userId: string;
  team: Team;
  score: number;
  tilesPlaced: number;
  placedBombs: number;
  placedRoadblocks: number;
  triggeredExplosions: number;
  explosionsCaused: number;
};

export type TeamState = {
  score: number;
  teamLetters: Record<string, TeamLetter>;
  placeholders: Record<string, PlacedTile>;
  bombs: number;
  roadblocks: number;
  placedTiles: number;
  energy: number;
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
  enableSpecials: boolean;
  roadblockDuration: number;
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
  totalPlacedTiles: number;
};

export type CurrentAction =
  | { type: "idle" }
  | { type: "select_letter"; letterId: string }
  | { type: "select_power_up"; powerup: "bomb" | "roadblock" }
  | { type: "select_trade_in"; letterIds: Record<string, TeamLetter> };

export type LocalGameState = {
  currentTurnTiles: Record<string, PlacedTile>;
  currentTurnDirection: Direction | null;
  currentAction: CurrentAction;
};

export type Stat = {
  username: string;
  value: number;
};

export type FinalGameStats = {
  mostPlacedTiles: Stat;
  mostPoints: Stat;
  mostPlacedBombs: Stat;
  mostTriggeredBombs: Stat;
  mostCausedExplosions: Stat;
  mostPlacedRoadblocks: Stat;
  teamPoints: Record<string, number>;
  winner: Team | "tie";
};
