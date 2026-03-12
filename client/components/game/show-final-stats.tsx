"use client";

import { useGameContext } from "@/hooks/gamecontext";
import { Button } from "../ui/button";
import { ArrowLeft, Users } from "lucide-react";
import { useRouter } from "next/navigation";

export function ShowFinalStats() {
  const { finalStats, leaveRoom, gamestate, user } = useGameContext();
  const router = useRouter();

  if (!gamestate || !user || !finalStats) return;

  const teamAScore = user.team === "a" ? gamestate.team.score : gamestate.totalScore - gamestate.team.score;

  return (
    <div className="flex flex-col items-center w-full gap-5">
      <div className="flex flex-col items-center justify-center text-center gap-1">
        <p className="text-2xl font-bold tracking-tight">{finalStats.winner === "tie" ? "Oavgjort" : user.team === finalStats.winner ? "Ni vann!" : "Ni förlorade"}</p>
        {finalStats.winner !== "tie" && <span className="text-base font-semibold text-muted-foreground">{finalStats.winner === "a" ? teamAScore : gamestate.totalScore - teamAScore} poäng</span>}
      </div>

      <div className="flex flex-col w-full gap-3">
        <div className="flex items-center justify-between px-6 py-3 rounded-lg bg-muted/40">
          <span className="text-sm text-muted-foreground">Mest insamlade poäng</span>

          <div className="flex items-center font-medium gap-4">
            <span className="text-lg font-bold">{finalStats.mostPoints.username}</span>
            <span className="text-muted-foreground">{finalStats.mostPoints.value}</span>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-3 rounded-lg bg-muted/40">
          <span className="text-sm text-muted-foreground">Flest placerade brickor</span>

          <div className="flex items-center font-medium gap-4">
            <span className="text-lg font-bold">{finalStats.mostPlacedTiles.username}</span>
            <span className="text-muted-foreground">{finalStats.mostPlacedTiles.value}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <Button className="flex items-center px-5 py-6 text-base gap-2" onClick={() => router.push("/")}>
          <Users />
          Tillbaka till matchlobby
        </Button>
        <Button className="flex items-center px-5 py-5 text-sm gap-2" variant="outline" onClick={() => leaveRoom()}>
          <ArrowLeft />
          Lämna
        </Button>
      </div>
    </div>
  );
}
