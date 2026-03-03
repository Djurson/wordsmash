import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Direction, PlacedTile } from "./types";
import { toast } from "sonner";
import { ToastError } from "./toastfunctions";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getTileKey = (x: number, y: number) => `${x},${y}`;

export const TILE_SIZE = 64;
export const GAP = 12;
export const CELL = TILE_SIZE + GAP;
export const MAX_ZOOM_OUT = 0.6;
export const MAX_ZOOM_IN = 2.0;

export const CROSSWORD_TILES: PlacedTile[] = [
  { letter: "H", x: -1, y: 0, team: "a", state: "placed" },
  { letter: "E", x: 0, y: 0, team: "a", state: "placed" },
  { letter: "J", x: 1, y: 0, team: "a", state: "placed" },
];

export const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ";

export const GenerateFirstCharactes = () => {
  const startletters = [];
  for (let i = 0; i < 15; i++) {
    startletters.push(LETTERS[Math.floor(Math.random() * LETTERS.length)]);
  }

  return startletters;
};

export function isValidPlacement(
  requestX: number,
  requestY: number,
  currentDirection: Direction | null,
  placedTiles: Record<string, PlacedTile>,
  currentTurnPlacements: Record<string, PlacedTile>,
): Direction | null | false {
  if (placedTiles[getTileKey(requestX, requestY)] || currentTurnPlacements[getTileKey(requestX, requestY)]) {
    ToastError("Platsen är upptagen!");
    return false;
  }

  const hasNeighbor =
    placedTiles[getTileKey(requestX + 1, requestY)] ||
    placedTiles[getTileKey(requestX - 1, requestY)] ||
    placedTiles[getTileKey(requestX, requestY + 1)] ||
    placedTiles[getTileKey(requestX, requestY - 1)];

  const hasPlaceholderNeighbor =
    currentTurnPlacements[getTileKey(requestX + 1, requestY)] ||
    currentTurnPlacements[getTileKey(requestX - 1, requestY)] ||
    currentTurnPlacements[getTileKey(requestX, requestY + 1)] ||
    currentTurnPlacements[getTileKey(requestX, requestY - 1)];

  // Checks if the tile has any neighbors
  if (!hasNeighbor && !hasPlaceholderNeighbor) {
    ToastError("Måste placeras vid en befintlig bricka!");
    return false;
  }

  const isFirstTileOfTurn = Object.keys(currentTurnPlacements).length === 0;

  if (isFirstTileOfTurn) {
    return currentDirection;
  }

  const firstPlaceholderKey = Object.keys(currentTurnPlacements)[0];
  const firstPlaceholder = currentTurnPlacements[firstPlaceholderKey];

  let newDirection = currentDirection;

  if (newDirection === null) {
    if (requestX === firstPlaceholder.x) {
      newDirection = "vertical";
    } else if (requestY === firstPlaceholder.y) {
      newDirection = "horizontal";
    } else {
      ToastError("Brickorna måste placeras på en rak linje!");
      return false;
    }
  } else {
    if (newDirection === "vertical" && requestX !== firstPlaceholder.x) {
      ToastError("Du bygger vertikalt! Håll dig på samma kolumn.");
      return false;
    }
    if (newDirection === "horizontal" && requestY !== firstPlaceholder.y) {
      ToastError("Du bygger horisontellt! Håll dig på samma rad.");
      return false;
    }
  }

  return newDirection;
}
