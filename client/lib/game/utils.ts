import { ToastError } from "../toastfunctions";
import { Direction, GameState, LocalGameState, PlacedTile } from "./types";

export const TILE_SIZE = 64;
export const GAP = 12;
export const CELL = TILE_SIZE + GAP;
export const MAX_ZOOM_OUT = 0.6;
export const MAX_ZOOM_IN = 2.0;

export const getTileKey = (x: number, y: number) => `${x},${y}`;
export const seperateTileKey = (key: string) => {
  const split = key.split(",");
  return { x: Number.parseInt(split[0]), y: Number.parseInt(split[1]) };
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

export type TileBoolNeighbors = { placeholder: boolean; placedTiles: boolean };

export function checkIfTileHasNeighbor(requestX: number, requestY: number, placedTiles: Record<string, PlacedTile>, currentTurnPlacements: Record<string, PlacedTile>): TileBoolNeighbors {
  let placedNeighbor = true;
  let placeholderNeighbor = true;

  const hasPlacedNeighbor =
    placedTiles[getTileKey(requestX + 1, requestY)] ||
    placedTiles[getTileKey(requestX - 1, requestY)] ||
    placedTiles[getTileKey(requestX, requestY + 1)] ||
    placedTiles[getTileKey(requestX, requestY - 1)];

  if (!hasPlacedNeighbor) {
    placedNeighbor = false;
  }

  const hasPlaceholderNeighbor =
    currentTurnPlacements[getTileKey(requestX + 1, requestY)] ||
    currentTurnPlacements[getTileKey(requestX - 1, requestY)] ||
    currentTurnPlacements[getTileKey(requestX, requestY + 1)] ||
    currentTurnPlacements[getTileKey(requestX, requestY - 1)];

  if (!hasPlaceholderNeighbor) {
    ToastError("Måste placeras vid en befintlig bricka!");
    placeholderNeighbor = false;
  }

  return { placeholder: placedNeighbor, placedTiles: placedNeighbor };
}

export type TestingResult = "failed" | "passed";

export function finalTesting(localGameState: LocalGameState, gamestate: GameState): TestingResult {
  const currentTiles = localGameState.currentTurnTiles;
  const tileKeys = Object.keys(currentTiles);

  if (tileKeys.length === 0) {
    ToastError("Du måste placera ut brickor för att göra ett drag.");
    return "failed";
  }

  let hasPlacedNeighbor = false;
  const xs: number[] = [];
  const ys: number[] = [];

  for (const key of tileKeys) {
    const { x, y } = seperateTileKey(key);
    const tile: PlacedTile = currentTiles[key];

    if (tile.x !== x || tile.y !== y) {
      return "failed";
    }

    xs.push(x);
    ys.push(y);

    const neighbors = checkIfTileHasNeighbor(x, y, gamestate.board, currentTiles);
    if (neighbors.placedTiles) {
      hasPlacedNeighbor = true;
      break;
    }
  }

  if (!hasPlacedNeighbor) {
    ToastError("Ditt ord måste sitta ihop med de befintliga brickorna på brädet.");
    return "failed";
  }

  if (tileKeys.length > 1) {
    const direction = localGameState.currentTurnDirection;

    if (direction === "horizontal") {
      const commonY = ys[0];
      const allSameRow = ys.every((y) => y === commonY);
      if (!allSameRow) {
        ToastError("Brickorna måste ligga på en horisontell linje.");
        return "failed";
      }

      xs.sort((a, b) => a - b);
      const minX = xs[0];
      const maxX = xs[xs.length - 1];

      for (let x = minX; x <= maxX; x++) {
        const key = getTileKey(x, commonY);
        if (!currentTiles[key] && !gamestate.board[key]) {
          ToastError("Det finns luckor i ditt ord. Brickorna måste sitta ihop.");
          return "failed";
        }
      }
    } else if (direction === "vertical") {
      const commonX = xs[0];
      const allSameCol = xs.every((x) => x === commonX);
      if (!allSameCol) {
        ToastError("Brickorna måste ligga på en vertikal linje.");
        return "failed";
      }

      ys.sort((a, b) => a - b);
      const minY = ys[0];
      const maxY = ys[ys.length - 1];

      for (let y = minY; y <= maxY; y++) {
        const key = getTileKey(commonX, y);
        if (!currentTiles[key] && !gamestate.board[key]) {
          ToastError("Det finns luckor i ditt ord. Brickorna måste sitta ihop.");
          return "failed";
        }
      }
    } else {
      ToastError("Ogiltig riktning. Vänligen avbryt draget och försök igen.");
      return "failed";
    }
  }

  return "passed";
}
