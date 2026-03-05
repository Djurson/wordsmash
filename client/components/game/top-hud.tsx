"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface TopHUDProps {
  selectedLetter: number | null;
  rackLetters: string[];
}

export function TopHUD({ selectedLetter, rackLetters }: TopHUDProps) {
  const [timeLeft, setTimeLeft] = useState(5 * 60);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isUrgent = timeLeft < 30;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 800, damping: 20 }}
      className="fixed z-50 flex flex-col items-center w-10/12 max-w-2xl mt-2 space-y-2">
      <div className="flex flex-col w-full px-4 py-3 border shadow-lg bg-card/80 backdrop-blur-xl border-border rounded-2xl md:px-6 md:py-4 gap-2">
        <div className="flex items-center justify-between">
          <TeamDisplay team="a" />
          {/* Timer */}
          <div className="flex flex-col items-center">
            <div className={cn("text-3xl md:text-4xl font-extrabold tabular-nums tracking-tight", isUrgent ? "text-destructive animate-pulse" : "text-foreground")}>
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>
          </div>

          <TeamDisplay team="b" />
        </div>
        <div className="flex w-full overflow-hidden rounded-xl bg-tile-accent">
          <div className="w-1/2 h-2 bg-tile-primary rounded-xl" />
        </div>
      </div>
      <div className="z-30 px-4 py-2 text-xs font-medium border rounded-full bg-white/90 shadow-sm backdrop-blur-md border-slate-200 text-slate-500">
        {selectedLetter ? `Klicka på brädet för att placera "${rackLetters[selectedLetter]}"` : "Dra för att panorera · Skrolla för att zooma"}
      </div>
    </motion.div>
  );
}

function TeamDisplay({ team }: { team: "a" | "b" }) {
  return (
    <div className="flex items-center gap-3">
      {team === "a" ? (
        <>
          <div className="rounded-full size-6 bg-tile-primary" />
          <span className="text-base font-bold text-foreground">Team A</span>
        </>
      ) : (
        <>
          <span className="text-base font-bold text-foreground">Team B</span>
          <div className="rounded-full size-6 bg-tile-accent" />
        </>
      )}
    </div>
  );
}
