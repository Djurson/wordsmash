"use client";
import { useGameContext } from "@/hooks/gamecontext";

export function ShowFinalStats() {
  const { finalStats } = useGameContext();

  return (
    <div className="flex flex-col items-center justify-start">
      <p>{finalStats?.winner}</p>
      <p>
        Mest insamlade poäng: {finalStats?.mostPoints.username} {finalStats?.mostPoints.value}
      </p>
      <p>
        Flest plaserade brickor: {finalStats?.mostPlacedTiles.username} {finalStats?.mostPlacedTiles.value}
      </p>
    </div>
  );
}
