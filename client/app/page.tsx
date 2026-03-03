"use client";

import { GameCanvas, PlacedTile } from "@/components/game-canvas";
import { PlayerDock } from "@/components/player-dock";
import { TopHUD } from "@/components/top-hud";
import { CROSSWORD_TILES, GenerateFirstCharactes } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

export default function Page() {
  const [tiles, setTiles] = useState<PlacedTile[]>(CROSSWORD_TILES);
  const [rackLetters, setRackLetters] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRackLetters(GenerateFirstCharactes());
  }, []);

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
      <PlayerDock letters={rackLetters} team="a" selectedIndex={selectedIndex} onSelectLetter={handleSelectLetter} onShuffle={handleShuffle} onTradeIn={() => {}} />
    </main>
  );
}
