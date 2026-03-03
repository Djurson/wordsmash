"use client";

import { ComponentExample } from "@/components/component-example";
import { GameCanvas, PlacedTile } from "@/components/game-canvas";
import { PlayerDock } from "@/components/player-dock";
import { TopHUD } from "@/components/top-hud";
import { useCallback, useEffect, useState } from "react";

const CROSSWORD_TILES: PlacedTile[] = [
  // "REACT" horizontal at row 3
  { letter: "R", x: 1, y: 3, team: "a" },
  { letter: "E", x: 2, y: 3, team: "a" },
  { letter: "A", x: 3, y: 3, team: "a" },
  { letter: "C", x: 4, y: 3, team: "a" },
  { letter: "T", x: 5, y: 3, team: "a" },

  { letter: "W", x: 1, y: 5, team: "b" },
  { letter: "E", x: 2, y: 5, team: "b" },
  { letter: "B", x: 3, y: 5, team: "b" },

  { letter: "G", x: 3, y: 1, team: "a" },
  { letter: "O", x: 4, y: 1, team: "a" },
  { letter: "D", x: 2, y: 6, team: "b" },
  { letter: "E", x: 3, y: 6, team: "b" },
  { letter: "V", x: 4, y: 6, team: "b" },
  { letter: "E", x: 3, y: 7, team: "a" },
];

const INITIAL_RACK = ["D", "I", "G", "L", "A", "T", "R"];

export default function Page() {
  const [tiles, setTiles] = useState<PlacedTile[]>(CROSSWORD_TILES);
  const [rackLetters, setRackLetters] = useState<string[]>(INITIAL_RACK);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const selectedLetter = selectedIndex !== null ? rackLetters[selectedIndex] : null;

  const handleSelectLetter = useCallback((index: number) => {
    setSelectedIndex((prev) => (prev === index ? null : index));
  }, []);

  const handlePlaceTile = useCallback(
    (x: number, y: number) => {
      if (selectedIndex === null) return;
      const letter = rackLetters[selectedIndex];
      const newTile: PlacedTile = {
        letter,
        x,
        y,
        team: "a",
      };
      setTiles((prev) => [...prev, newTile]);
      setRackLetters((prev) => prev.filter((_, i) => i !== selectedIndex));
      setSelectedIndex(null);
    },
    [selectedIndex, rackLetters],
  );

  const handleShuffle = useCallback(() => {
    setRackLetters((prev) => {
      const shuffled = [...prev];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    });
    setSelectedIndex(null);
  }, []);

  // Escape to deselect
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedIndex(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <main className="w-full h-dvh overflow-hidden bg-background flex flex-col items-center">
      <TopHUD selectedLetter={selectedIndex} rackLetters={rackLetters} />
      <GameCanvas tiles={tiles} selectedLetter={selectedLetter} onPlaceTile={handlePlaceTile} />
      <PlayerDock letters={rackLetters} team="a" selectedIndex={selectedIndex} onSelectLetter={handleSelectLetter} onShuffle={handleShuffle} />
    </main>
  );
}
