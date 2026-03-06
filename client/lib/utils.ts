import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { PlacedTile } from "./game/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
