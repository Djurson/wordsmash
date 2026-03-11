"use client";

import { useGameContext } from "@/hooks/gamecontext";
import { Button } from "../ui/button";
import { ArrowLeft, Users } from "lucide-react";
import { useRouter } from "next/navigation";

export function ShowFinalStats() {
  const { finalStats, leaveRoom } = useGameContext();
  const router = useRouter();

  return (
    <div className="flex flex-col items-center w-full gap-5">
      <div className="text-center">
        <p className="text-2xl font-bold tracking-tight">{finalStats?.winner === "tie" ? "Oavgjort" : `Lag ${finalStats?.winner.toUpperCase()} vann`}</p>
      </div>

      <div className="flex flex-col w-full gap-3">
        <div className="flex items-center justify-between px-6 py-3 rounded-lg bg-muted/40">
          <span className="text-sm text-muted-foreground">Mest insamlade poäng</span>

          <div className="flex items-center gap-4 font-medium">
            <span className="text-lg font-bold">{finalStats?.mostPoints.username}</span>
            <span className="text-muted-foreground">{finalStats?.mostPoints.value}</span>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-3 rounded-lg bg-muted/40">
          <span className="text-sm text-muted-foreground">Flest placerade brickor</span>

          <div className="flex items-center gap-4 font-medium">
            <span className="text-lg font-bold">{finalStats?.mostPlacedTiles.username}</span>
            <span className="text-muted-foreground">{finalStats?.mostPlacedTiles.value}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <Button className="flex items-center gap-2 px-5 py-6 text-base">
          <Users />
          Tillbaka till matchlobby
        </Button>
        <Button
          className="flex items-center gap-2 px-5 py-5 text-sm"
          variant="outline"
          onClick={() => {
            leaveRoom();
            router.push("/");
          }}>
          <ArrowLeft />
          Lämna
        </Button>
      </div>
    </div>
  );
}
