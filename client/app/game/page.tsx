"use client";

import { GameCanvas } from "@/components/game/game-canvas";
import { PlayerDock } from "@/components/game/player-dock";
import { TopHUD } from "@/components/game/top-hud";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useGameContext } from "@/hooks/gamecontext";
import { CELL } from "@/lib/game/utils";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function Page() {
  const { gamestate, user } = useGameContext();
  const router = useRouter();

  const [countdown, setCountDown] = useState<number>(0);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    if (!gamestate) return;

    const calculateTimeLeft = () => {
      const difference = gamestate.startTime - Date.now();
      if (difference <= 0) {
        setCountDown(0);
        return;
      }

      setCountDown(difference);
      requestRef.current = requestAnimationFrame(calculateTimeLeft);
    };

    requestRef.current = requestAnimationFrame(calculateTimeLeft);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [gamestate]);

  const totalSeconds = Math.floor(countdown / 1000);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.round((countdown % 1000) / 10);

  useEffect(() => {
    if (!gamestate || !user) {
      router.push("/");
      return;
    }
  }, [gamestate, router, user]);

  if (!gamestate) return null;

  return (
    <main className="flex flex-col items-center w-full overflow-hidden h-dvh bg-background">
      {countdown > 0 ? (
        <>
          <div
            className="fixed inset-0 overflow-hidden touch-none"
            style={{
              backgroundImage: "radial-gradient(circle, var(--canvas-dot, #cbd5e1) 1.5px, transparent 1.5px)",
              backgroundColor: "var(--background, --tile-secondary)",
              backgroundSize: `${CELL}px ${CELL}px`,
              backgroundPosition: `calc(50% + ${CELL}px) calc(50% + ${CELL / 2}px)`,
            }}
          />
          <Dialog defaultOpen>
            <DialogContent showCloseButton={false} onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()} className="gap-2!" overlayBlur={false}>
              <DialogHeader>
                <DialogTitle>Get Ready</DialogTitle>
                <DialogDescription className="hidden"></DialogDescription>
              </DialogHeader>
              <div className="flex-1 w-full text-3xl font-extrabold tracking-tight text-center md:text-6xl tabular-nums">{`${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`}</div>
            </DialogContent>
          </Dialog>
        </>
      ) : gamestate.gameStarted && gamestate.gameOver === false ? (
        <>
          <TopHUD />
          <GameCanvas />
          <PlayerDock />
        </>
      ) : (
        <div
          className="fixed inset-0 overflow-hidden touch-none"
          style={{
            backgroundImage: "radial-gradient(circle, var(--canvas-dot, #cbd5e1) 1.5px, transparent 1.5px)",
            backgroundColor: "var(--background, --tile-secondary)",
            backgroundSize: `${CELL}px ${CELL}px`,
            backgroundPosition: `calc(50% + ${CELL}px) calc(50% + ${CELL / 2}px)`,
          }}
        />
      )}
    </main>
  );
}
