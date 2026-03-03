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
      className="fixed z-50 w-10/12 max-w-2xl flex flex-col items-center space-y-2 mt-2">
      <div className="bg-card/80 backdrop-blur-xl border border-border rounded-2xl shadow-lg px-4 py-3 md:px-6 md:py-4 w-full flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <TeamDisplay team="a" />
          {/* Timer */}
          <div className="flex flex-col items-center">
            <div
              className={cn("text-3xl md:text-4xl font-extrabold tabular-nums tracking-tight", isUrgent ? "text-destructive animate-pulse" : "text-foreground")}
              style={{ fontFamily: "var(--font-nunito)" }}>
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>
          </div>

          <TeamDisplay team="b" />
        </div>
        <div className="flex w-full rounded-xl overflow-hidden bg-tile-accent">
          <div className="w-3/4 bg-tile-primary h-2 rounded-xl" />
        </div>
      </div>
      <div className="px-4 py-2 rounded-full bg-white/90 shadow-sm backdrop-blur-md border border-slate-200 text-xs text-slate-500 font-medium z-30">
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
          <div className="size-6 rounded-full bg-tile-primary" />
          <span className="text-base font-bold text-foreground">Team A</span>
        </>
      ) : (
        <>
          <span className="text-base font-bold text-foreground">Team B</span>
          <div className="size-6 rounded-full bg-tile-accent" />
        </>
      )}
    </div>
  );
}
