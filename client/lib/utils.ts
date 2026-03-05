import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { PlacedTile } from "./game/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CROSSWORD_TILES: PlacedTile[] = [
  { letter: "H", x: -1, y: 0, team: "a", state: "placed" },
  { letter: "E", x: 0, y: 0, team: "a", state: "placed" },
  { letter: "J", x: 1, y: 0, team: "a", state: "placed" },
];

export const MOCK_PLAYERS = [
  { id: "1", name: "You", avatar: "Y", isHost: true, isReady: true, team: "A" as const },
  { id: "2", name: "LetterWiz", avatar: "L", isHost: false, isReady: true, team: "A" as const },
  { id: "3", name: "TileKing", avatar: "T", isHost: false, isReady: false, team: "B" as const },
];

export const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ";

export const GenerateFirstCharactes = () => {
  const startletters = [];
  for (let i = 0; i < 15; i++) {
    startletters.push(LETTERS[Math.floor(Math.random() * LETTERS.length)]);
  }

  return startletters;
};

export function GenerateGameCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${segment()}-${segment()}`;
}
