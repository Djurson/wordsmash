import { PlacedTile } from "@/components/game-canvas";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const TILE_SIZE = 64;
export const GAP = 12;
export const CELL = TILE_SIZE + GAP;
export const MAX_ZOOM_OUT = 0.6;
export const MAX_ZOOM_IN = 2.0;

export const CROSSWORD_TILES: PlacedTile[] = [
  { letter: "H", x: -1, y: 0, team: "a" },
  { letter: "E", x: 0, y: 0, team: "a" },
  { letter: "J", x: 1, y: 0, team: "a" },
];

export const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ";

export const GenerateFirstCharactes = () => {
  const startletters = [];
  for (let i = 0; i < 15; i++) {
    startletters.push(LETTERS[Math.floor(Math.random() * LETTERS.length)]);
  }

  return startletters;
};
