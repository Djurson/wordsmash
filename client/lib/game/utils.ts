import { ToastError } from "../toastfunctions";
import { Direction, PlacedTile } from "./types";

export const TILE_SIZE = 64;
export const GAP = 12;
export const CELL = TILE_SIZE + GAP;
export const MAX_ZOOM_OUT = 0.6;
export const MAX_ZOOM_IN = 2.0;

export const getTileKey = (x: number, y: number) => `${x},${y}`;

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

export function checkIfTileHasNeighbor(requestX: number, requestY: number, placedTiles: Record<string, PlacedTile>, currentTurnPlacements: Record<string, PlacedTile>): boolean {
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

  if (!hasNeighbor && !hasPlaceholderNeighbor) {
    ToastError("Måste placeras vid en befintlig bricka!");
    return false;
  }

  return true;
}
