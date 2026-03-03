"use client";

import { motion } from "framer-motion";
import { GripHorizontal, Shuffle } from "lucide-react";
import GameTile from "./game-tile";

interface PlayerDockProps {
  letters: string[];
  team?: "a" | "b";
  selectedIndex: number | null;
  onSelectLetter: (index: number) => void;
  onShuffle: () => void;
}

export function PlayerDock({ letters, team = "a", selectedIndex, onSelectLetter, onShuffle }: PlayerDockProps) {
  return (
    <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, type: "spring" }} className="fixed bottom-2 z-50">
      <div className="bg-card/90 backdrop-blur-xl border border-border rounded-2xl shadow-2xl px-4 py-4 md:px-8 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-muted-foreground">Dina brickor</span>
            <span className="text-[10px] font-mono font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md ml-1">{letters.length} kvar</span>
          </div>
          <button
            onClick={onShuffle}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-primary/10 transition-colors border border-border active:scale-95"
            aria-label="Blanda brickor">
            <Shuffle className="w-3.5 h-3.5" />
            Blanda
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 md:gap-3">
          {letters.map((letter, index) => (
            <motion.div
              layout
              key={`dock-tile-${index}-${letter}`}
              initial={{ y: 20, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05, type: "spring" }}>
              <div
                onClick={() => onSelectLetter(index)}
                className={`cursor-pointer transition-transform duration-200 ${selectedIndex === index ? "-translate-y-3 scale-110 drop-shadow-lg" : "hover:-translate-y-1"}`}>
                <GameTile letter={letter} />
              </div>
            </motion.div>
          ))}

          {letters.length === 0 && <div className="text-sm text-muted-foreground italic py-4">Väntar på nya brickor...</div>}
        </div>
      </div>
    </motion.div>
  );
}
