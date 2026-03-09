"use client";

import { motion } from "framer-motion";
import { Repeat1, Shuffle } from "lucide-react";
import GameTile from "./game-tile";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { useGameContext } from "@/hooks/gamecontext";
import { useEffect } from "react";
import { TeamLetter } from "@/lib/game/types";

export function PlayerDock() {
  const { gamestate, user, localGameState, handleSelectLetter, handleCancelPlacement, handleSubmitPlacement } = useGameContext();

  const handleTradeIn = () => {};

  const handleShuffle = () => {};

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCancelPlacement();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleCancelPlacement]);

  if (!gamestate || !user) return null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, type: "spring", bounceDamping: 15, bounce: 0.7 }}
      className="fixed z-50 flex flex-col items-center justify-center bottom-4">
      <div className="px-4 pt-4 pb-6 space-y-6 border shadow-2xl bg-card/90 backdrop-blur-xl border-border rounded-2xl md:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-base font-semibold text-muted-foreground">Ditt lags brickor</span>
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md ml-1">{Object.keys(gamestate.team.teamLetters).length} kvar</span>
          </div>
          <div className={`flex gap-2 duration-300 ease-in-out ${Object.keys(localGameState.currentTurnTiles).length > 0 ? "translate-y-0" : "translate-y-86"}`}>
            <Button size="sm" variant="outline" className="text-tile-foreground! px-5 flex items-center" onClick={handleCancelPlacement}>
              Avbryt{" "}
              <Kbd data-icon="inline-end" className="px-2 bg-tile-secondary/5">
                Esc {localGameState.selectedLetterId ? "+ Esc" : ""}
              </Kbd>
            </Button>
            <Button size="sm" variant="default" className="text-tile-foreground! px-5 flex items-center" onClick={handleSubmitPlacement}>
              Klar{" "}
              <Kbd data-icon="inline-end" className="px-2 bg-tile-secondary/50">
                ⏎
              </Kbd>
            </Button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleShuffle}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-primary/10 transition-colors border border-border active:scale-95"
              aria-label="Blanda brickor">
              <Shuffle className="w-3.5 h-3.5" />
              Blanda
            </button>
            <button
              onClick={handleTradeIn}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-tile-secondary text-foreground text-sm font-medium hover:bg-tile-secondary/10 transition-colors border border-border active:scale-95"
              aria-label="Byt in">
              <Repeat1 className="w-3.5 h-3.5" />
              Byt in
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 md:gap-3">
          {Object.keys(gamestate.team.teamLetters).map((key, index) => {
            const teamLetter: TeamLetter = gamestate.team.teamLetters[key];
            return (
              <motion.div
                layout
                key={`dock-tile-${key}`}
                initial={{ y: 100, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.05, type: "spring", bounce: 0.75, bounceDamping: 15 }}>
                <div
                  onClick={
                    gamestate.team.teamLetters[key].isLocked
                      ? () => {
                          // console.log("isLocked", gamestate.team.teamLetters[key].isLocked);
                        }
                      : () => {
                          // console.log("key", key);
                          handleSelectLetter(key);
                        }
                  }
                  className={`cursor-pointer transition-transform duration-200 ${localGameState.selectedLetterId === key || gamestate.team.teamLetters[key].isLocked ? "-translate-y-3 scale-110 drop-shadow-lg" : "hover:-translate-y-1"}`}>
                  <GameTile letter={teamLetter.letter} state={gamestate.team.teamLetters[key].isLocked ? "locked" : "idle"} score={teamLetter.score} />
                </div>
              </motion.div>
            );
          })}

          {Object.keys(gamestate.team.teamLetters).length === 0 && <div className="py-4 text-sm text-muted-foreground">Väntar på nya brickor...</div>}
        </div>
      </div>
    </motion.div>
  );
}
