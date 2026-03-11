"use client";

import { useGameContext } from "@/hooks/gamecontext";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function TopHUD() {
  const { gamestate, user, localGameState, finalStats } = useGameContext();
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const requestRef = useRef<number>(0);
  const router = useRouter();

  useEffect(() => {
    if (!gamestate) return;

    const calculateTimeLeft = () => {
      const difference = gamestate.endTime - Date.now();

      if (difference <= 0) {
        setTimeLeft(0);
        return;
      }

      setTimeLeft(difference);
      requestRef.current = requestAnimationFrame(calculateTimeLeft);
    };

    requestRef.current = requestAnimationFrame(calculateTimeLeft);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [gamestate]);

  const totalSeconds = Math.floor(timeLeft / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.round((timeLeft % 1000) / 10);
  const isUrgent = timeLeft < 30000;

  if (!gamestate || !user) return null;

  const teamAScore = user.team === "a" ? gamestate.team.score : gamestate.totalScore - gamestate.team.score;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 800, damping: 20 }}
      className="fixed z-50 flex flex-col items-center w-10/12 max-w-2xl mt-2 space-y-2">
      <div className="flex flex-col w-full gap-2 px-4 py-3 border shadow-lg bg-card/80 backdrop-blur-xl border-border rounded-2xl md:px-6 md:py-4">
        <div className="flex items-center justify-between">
          <TeamDisplay team="a" teamScore={teamAScore} />
          {/* Timer */}
          <div className="flex flex-col items-center">
            <div className={cn("text-3xl md:text-4xl font-extrabold tabular-nums tracking-tight", isUrgent ? "text-destructive animate-pulse" : "text-foreground")}>
              {minutes > 0
                ? /* There are still minutes left */
                  `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
                : /* Few seconds left */
                  `${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(2, "0")}`}
            </div>
          </div>

          <TeamDisplay team="b" teamScore={gamestate.totalScore - teamAScore} />
        </div>
        <div className="flex w-full overflow-hidden rounded-xl bg-tile-accent">
          <div className="h-2 bg-tile-primary rounded-xl" style={{ width: `${teamAScore === 0 && gamestate.totalScore === 0 ? 50 : (teamAScore / gamestate.totalScore) * 100}%` }} />
        </div>
      </div>
      <div
        className={`z-30 px-4 py-2 text-xs font-medium border rounded-full shadow-sm bg-white/90 backdrop-blur-md border-slate-200 text-slate-500 duration-300 ease-in-out ${finalStats ? "cursor-pointer hover:bg-tile-secondary hover:border-tile-border" : ""}`}
        onClick={() => {
          if (finalStats) router.push("/");
        }}>
        {localGameState.selectedLetterId && !finalStats ? (
          /* Show letter if a letter is selected */
          `Klicka på brädet för att placera "${gamestate.team.teamLetters[localGameState.selectedLetterId].letter}"`
        ) : !finalStats /* Show zoom / pan text if no letter is selected */ ? (
          "Dra för att panorera · Skrolla för att zooma"
        ) : (
          <div className="flex gap-2">
            <ArrowLeft className="size-4" />
            Tillbaka
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TeamDisplay({ team, teamScore }: { team: "a" | "b"; teamScore: number }) {
  return (
    <div className="flex items-center justify-between gap-8">
      {team === "b" && <p className="text-sm font-bold text-foreground">Poäng: {teamScore}</p>}
      <div className="flex items-center gap-3">
        {team === "a" ? (
          <>
            <div className="rounded-full size-6 bg-tile-primary" />
            <span className="text-base font-bold text-foreground">Lag A</span>
          </>
        ) : (
          <>
            <span className="text-base font-bold text-foreground">Lag B</span>
            <div className="rounded-full size-6 bg-tile-accent" />
          </>
        )}
      </div>
      {team === "a" && <p className="text-sm font-bold text-foreground">Poäng: {teamScore}</p>}
    </div>
  );
}
