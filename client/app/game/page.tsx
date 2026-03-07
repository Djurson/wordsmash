"use client";

import { GameCanvas } from "@/components/game/game-canvas";
import { PlayerDock } from "@/components/game/player-dock";
import { TopHUD } from "@/components/game/top-hud";
import { useGameContext } from "@/hooks/gamecontext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
  const { gamestate, user } = useGameContext();
  const router = useRouter();

  useEffect(() => {
    if (!gamestate || !user) {
      router.push("/");
      return;
    }
  }, [gamestate, router]);

  if (!gamestate) return null;

  return (
    <main className="flex flex-col items-center w-full overflow-hidden h-dvh bg-background">
      <TopHUD />
      <GameCanvas />
      <PlayerDock />
    </main>
  );
}
