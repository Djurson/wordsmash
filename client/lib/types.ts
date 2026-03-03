export interface PlacedTile {
  letter: string;
  x: number;
  y: number;
  team: "a" | "b";
  state: "placed" | "placeholder";
}

export type Direction = "vertical" | "horizontal";
