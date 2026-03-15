"use client";

import { useGameContext } from "@/hooks/gamecontext";
import { Button } from "../ui/button";
import { ArrowLeft, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { FinalGameStats, Stat } from "@/lib/game/types";

const STATS = [
  {
    title: "Brickmästare",
    description: "Flest brickor",
    statKey: "mostPlacedTiles",
  },
  {
    title: "Bombmästare",
    description: "Flest bomber placerade",
    statKey: "mostPlacedBombs",
  },
  {
    title: "Störst förödelse",
    description: "Flest explosioner",
    statKey: "mostCausedExplosions",
  },
  {
    title: "Sabotör",
    description: "Flest bomber triggade",
    statKey: "mostTriggeredBombs",
  },
  {
    title: "Väggmästare",
    description: "Flest spärrar",
    statKey: "mostPlacedRoadblocks",
  },
];

export function ShowFinalStats() {
  const { finalStats, leaveRoom, gamestate, user } = useGameContext();
  const router = useRouter();

  if (!gamestate || !user || !finalStats) return;

  const teamAScore = user.team === "a" ? gamestate.team.score : gamestate.totalScore - gamestate.team.score;

  return (
    <div className="flex flex-col items-center w-full gap-5">
      <div className="flex flex-col items-center justify-center gap-1 text-center">
        <p className="text-2xl font-bold tracking-tight">{finalStats.winner === "tie" ? "Oavgjort" : user.team === finalStats.winner ? "Ni vann!" : "Ni förlorade"}</p>
        {finalStats.winner !== "tie" && <span className="text-base font-semibold text-muted-foreground">{finalStats.winner === "a" ? teamAScore : gamestate.totalScore - teamAScore} poäng</span>}
      </div>

      <div className="grid w-full grid-cols-2 gap-3">
        <div className="p-5 text-center rounded-xl bg-primary/10">
          <p className="text-sm text-muted-foreground">Matchens MVP</p>
          <p className="text-2xl font-bold">{finalStats.mostPoints.username}</p>
          <p className="text-lg font-semibold text-primary">{finalStats.mostPoints.value} poäng</p>
        </div>
        {STATS.map((s) => {
          const stat = finalStats[s.statKey as keyof FinalGameStats] as Stat;
          return (
            <div key={s.title} className="flex flex-col items-center p-4 rounded-xl bg-muted/40">
              <p className="mt-1 text-xs text-muted-foreground">{s.description}</p>
              <p className="text-lg font-bold">{stat.username}</p>
              <p className="text-xl font-black text-primary">{stat.value}</p>
            </div>
          );
        })}
      </div>
      <div className="flex flex-col gap-3">
        <Button className="flex items-center gap-2 px-5 py-6 text-base" onClick={() => router.push("/")}>
          <Users />
          Tillbaka till matchlobby
        </Button>
        <Button className="flex items-center gap-2 px-5 py-5 text-sm" variant="outline" onClick={() => leaveRoom()}>
          <ArrowLeft />
          Lämna
        </Button>
      </div>
    </div>
  );
}

function ShowStat({ title, stat }: { title: string; stat: Stat }) {
  return (
    <div className="flex items-center justify-between px-6 py-3 rounded-lg bg-muted/40">
      <span className="text-sm text-muted-foreground">{title}</span>

      <div className="flex items-center gap-4 font-medium">
        <span className="text-lg font-bold">{stat.username}</span>
        <span className="text-muted-foreground">{stat.value}</span>
      </div>
    </div>
  );
}
