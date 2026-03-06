"use client";

import { GameCanvas } from "@/components/game/game-canvas";
import { PlayerDock } from "@/components/game/player-dock";
import { TopHUD } from "@/components/game/top-hud";
import { useGameContext } from "@/hooks/websocket";
import { Direction, PlacedTile } from "@/lib/game/types";
import { getTileKey, isValidPlacement } from "@/lib/game/utils";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function Page() {
  const { gamestate, user } = useGameContext();
  const router = useRouter();

  const [currentTurnTiles, setcurrentTurnTiles] = useState<Record<string, PlacedTile>>({});
  const [currentDirection, setCurrentDirection] = useState<Direction | null>(null);
  const [rackLetters, setRackLetters] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!gamestate || !user) {
      router.push("/");
      return;
    }

    setRackLetters(gamestate.teams[user.team].letters);
  }, [gamestate, router]);

  const selectedLetter = selectedIndex !== null ? rackLetters[selectedIndex] : null;

  const handleSelectLetter = useCallback((index: number) => {
    setSelectedIndex((prev) => (prev === index ? null : index));
  }, []);

  const handlePlaceTile = useCallback(
    (x: number, y: number) => {
      if (selectedIndex === null) return;

      // Rule checking
      const validationResult = isValidPlacement(x, y, currentDirection, gamestate?.board ?? {}, currentTurnTiles);

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
    [selectedIndex, rackLetters, gamestate?.board, currentTurnTiles, currentDirection],
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

  if (!gamestate) return null;

  return (
    <main className="flex flex-col items-center w-full overflow-hidden h-dvh bg-background">
      <TopHUD selectedLetter={selectedIndex} />
      <GameCanvas tiles={{ ...gamestate.board, ...currentTurnTiles }} selectedLetter={selectedLetter} onPlaceTile={handlePlaceTile} />
      <PlayerDock selectedIndex={selectedIndex} onSelectLetter={handleSelectLetter} onShuffle={handleShuffle} onTradeIn={() => {}} hasPlaceholders={Object.keys(currentTurnTiles).length > 0} />
    </main>
  );
}
