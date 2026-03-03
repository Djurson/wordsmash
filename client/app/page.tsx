"use client";

import { GameCanvas } from "@/components/game-canvas";
import { PlayerDock } from "@/components/player-dock";
import { TopHUD } from "@/components/top-hud";
import { Direction, PlacedTile } from "@/lib/types";
import { CROSSWORD_TILES, GenerateFirstCharactes, getTileKey, isValidPlacement } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

export default function Page() {
  const [placedTiles, setPlacedTiles] = useState<Record<string, PlacedTile>>(() => {
    const initialMap: Record<string, PlacedTile> = {};
    CROSSWORD_TILES.forEach((tile) => {
      initialMap[getTileKey(tile.x, tile.y)] = tile;
    });
    return initialMap;
  });
  const [currentTurnTiles, setcurrentTurnTiles] = useState<Record<string, PlacedTile>>({});
  const [currentDirection, setCurrentDirection] = useState<Direction | null>(null);
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

      // Rule checking
      const validationResult = isValidPlacement(x, y, currentDirection, placedTiles, currentTurnTiles);

      if (validationResult === false) {
        return;
      }

      const targetKey = getTileKey(x, y);
      const letter = rackLetters[selectedIndex];

      const newTile: PlacedTile = { letter, x, y, team: "a", state: "placeholder" };

      setcurrentTurnTiles((prev) => ({ ...prev, [targetKey]: newTile }));
      setCurrentDirection(validationResult);
      setRackLetters((prev) => prev.filter((_, i) => i !== selectedIndex));
      setSelectedIndex(null);
    },
    [selectedIndex, rackLetters, placedTiles, currentTurnTiles, currentDirection],
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

  const handleCancelPlacement = useCallback(() => {
    if (selectedIndex !== null) {
      setSelectedIndex(null);
      return;
    }

    if (Object.keys(currentTurnTiles).length > 0) {
      let placeholderLetters: string[] = [];

      for (const key in currentTurnTiles) {
        placeholderLetters.push(currentTurnTiles[key].letter);
      }

      setRackLetters((prev) => [...prev, ...placeholderLetters]);
      setcurrentTurnTiles({});
      setCurrentDirection(null);
    }
  }, [selectedIndex, currentTurnTiles]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCancelPlacement();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleCancelPlacement]);

  return (
    <main className="w-full h-dvh overflow-hidden bg-background flex flex-col items-center">
      <TopHUD selectedLetter={selectedIndex} rackLetters={rackLetters} />
      <GameCanvas tiles={{ ...placedTiles, ...currentTurnTiles }} selectedLetter={selectedLetter} onPlaceTile={handlePlaceTile} />
      <PlayerDock
        letters={rackLetters}
        team="a"
        selectedIndex={selectedIndex}
        onSelectLetter={handleSelectLetter}
        onShuffle={handleShuffle}
        onTradeIn={() => {}}
        hasPlaceholders={Object.keys(currentTurnTiles).length > 0}
      />
    </main>
  );
}
