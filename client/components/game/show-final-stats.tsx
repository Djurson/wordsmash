"use client";
import { useGameContext } from "@/hooks/gamecontext";

export function ShowFinalStats() {
  const { finalStats } = useGameContext();

  return (
    <div className="flex flex-col items-center justify-start gap-3">
      <p className="text-xl font-bold">{finalStats?.winner === "tie" ? "Oavgjort" : `Lag ${finalStats?.winner.toUpperCase()} Vann`}</p>
      <div className="grid grid-rows-2 grid-cols-2 gap-2 w-fit">
        <p>Mest insamlade poäng: </p>
        <p className="flex gap-1 items-center">
          {finalStats?.mostPoints.username}
          <span>{finalStats?.mostPoints.value}</span>
        </p>
        <p>Flest plaserade brickor: </p>
        <p>
          {finalStats?.mostPlacedTiles.username}
          <span>{finalStats?.mostPlacedTiles.value}</span>
        </p>
      </div>
    </div>
  );
}
