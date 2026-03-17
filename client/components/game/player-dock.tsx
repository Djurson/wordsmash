"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bomb, Construction, Repeat } from "lucide-react";
import GameTile from "./game-tile";
import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { useGameContext } from "@/hooks/gamecontext";
import { useEffect } from "react";
import { TeamLetter } from "@/lib/game/types";
import { TRADE_IN_COSt_PER_TILE } from "@/lib/game/utils";

export function PlayerDock() {
  const {
    gamestate,
    user,
    localGameState,
    handleSelectLetter,
    handleCancelPlacement,
    handleSubmitPlacement,
    handleRemoveSingleTileByLetterId,
    handleSelectPowerup,
    handleToggleTradeInMode,
    handleToggleTradeInLetter,
    handleSubmitTradeIn,
  } = useGameContext();

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

  const isTradeInMode = localGameState.currentAction.type === "select_trade_in";
  const tradeInSelectionCount = localGameState.currentAction.type === "select_trade_in" ? Object.keys(localGameState.currentAction.letterIds).length : 0;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, type: "spring", bounceDamping: 15, bounce: 0.7 }}
      className="fixed z-50 flex flex-col items-center justify-center bottom-4">
      {/* TEMPORARY SOLUTION */}
      <AnimatePresence>
        {isTradeInMode && tradeInSelectionCount > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute left-1/2 -translate-x-1/2 -top-14">
            <Button onClick={handleSubmitTradeIn} className="shadow-lg bg-tile-primary hover:bg-tile-primary/80 text-tile-foreground rounded-full px-6 cursor-pointer">
              Byt in {tradeInSelectionCount} brickor (Kostnad: {tradeInSelectionCount * TRADE_IN_COSt_PER_TILE} energi)
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 pt-4 pb-6 border shadow-2xl space-y-6 bg-card/90 backdrop-blur-xl border-border rounded-2xl md:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-base font-semibold text-muted-foreground">Ditt lags brickor</span>
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md ml-1">{Object.keys(gamestate.team.teamLetters).length} kvar</span>
          </div>
          <div className={`flex gap-2 duration-300 ease-in-out ${Object.keys(localGameState.currentTurnTiles).length > 0 ? "translate-y-0" : "translate-y-86"}`}>
            <Button size="sm" variant="outline" className="text-tile-foreground! px-5 flex items-center" onClick={handleCancelPlacement}>
              Avbryt{" "}
              <KbdGroup>
                <Kbd data-icon="inline-end" className="px-2 bg-tile-secondary/5">
                  Esc
                </Kbd>
                {localGameState.currentAction.type !== "idle" && (
                  <>
                    {" + "}
                    <Kbd data-icon="inline-end" className="px-2 bg-tile-secondary/5">
                      Esc
                    </Kbd>
                  </>
                )}
              </KbdGroup>
            </Button>
            <Button size="sm" variant="default" className="text-tile-foreground! px-5 flex items-center" onClick={handleSubmitPlacement}>
              Klar{" "}
              <Kbd data-icon="inline-end" className="px-2 bg-tile-secondary/50">
                ⏎
              </Kbd>
            </Button>
          </div>
          <div className="flex gap-2">
            {/* Trade In Button */}
            <Button
              disabled={gamestate.team.roadblocks === 0}
              variant="outline"
              onClick={handleToggleTradeInMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border active:scale-95 ${
                localGameState.currentAction.type === "select_power_up" && localGameState.currentAction.powerup === "roadblock" ? "bg-tile-locked/50" : "text-foreground hover:bg-card border-border"
              }`}
              aria-label="Roadblocks">
              <Repeat className="size-5" />
              Byt in brickor
            </Button>

            {/* Roadblock Button */}
            <Button
              disabled={gamestate.team.roadblocks === 0}
              onClick={() => handleSelectPowerup("roadblock")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border active:scale-95 ${
                localGameState.currentAction.type === "select_power_up" && localGameState.currentAction.powerup === "roadblock"
                  ? "bg-red-500/20 border-red-500 text-red-500 hover:bg-red-500/30"
                  : "bg-secondary text-foreground hover:bg-primary/10 border-border"
              }`}
              aria-label="Roadblocks">
              <Construction className="size-5" />
              Spärrar
              <span className={`text-sm ${localGameState.currentAction.type === "select_power_up" && localGameState.currentAction.powerup === "roadblock" ? "text-red-500" : "text-muted-foreground"}`}>
                {gamestate.team.roadblocks ?? 0}
              </span>
            </Button>

            {/* Bomb Button */}
            <Button
              disabled={gamestate.team.bombs === 0}
              onClick={() => handleSelectPowerup("bomb")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border active:scale-95 ${
                localGameState.currentAction.type === "select_power_up" && localGameState.currentAction.powerup === "bomb"
                  ? "bg-red-500/20 border-red-500 text-red-500 hover:bg-red-500/30"
                  : "bg-tile-secondary text-foreground hover:bg-tile-secondary/10 border-border"
              }`}
              aria-label="Bomber">
              <Bomb className="size-5" />
              Bomber
              <span className={`text-sm ${localGameState.currentAction.type === "select_power_up" && localGameState.currentAction.powerup === "bomb" ? "text-red-500" : "text-muted-foreground"}`}>
                {gamestate.team.bombs ?? 0}
              </span>
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 md:gap-3">
          {Object.keys(gamestate.team.teamLetters).map((key, index) => {
            const teamLetter: TeamLetter = gamestate.team.teamLetters[key];
            const isLockedByMe = teamLetter.isLocked && teamLetter.lockedBy === user.userId;
            const onRemove = isLockedByMe
              ? (e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleRemoveSingleTileByLetterId(teamLetter.id);
                }
              : undefined;
            const isTradeInSelected = localGameState.currentAction.type === "select_trade_in" && !!localGameState.currentAction.letterIds[key];
            const isLockedByOther = teamLetter.isLocked && teamLetter.lockedBy !== user.userId;
            return (
              <motion.div
                layout
                key={`dock-tile-${key}`}
                initial={{ y: 100, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.05, type: "spring", bounce: 0.75, bounceDamping: 15 }}>
                <div
                  onClick={() => {
                    if (isLockedByOther) return;
                    if (isTradeInMode) {
                      handleToggleTradeInLetter(key);
                    } else {
                      handleSelectLetter(key);
                    }
                  }}
                  className={`cursor-pointer transition-transform duration-200 ${
                    (localGameState.currentAction.type === "select_letter" && localGameState.currentAction.letterId === key) || isTradeInSelected || isLockedByOther
                      ? "-translate-y-3 scale-110 drop-shadow-lg"
                      : "hover:-translate-y-1"
                  }`}>
                  <GameTile letter={teamLetter.letter} state={teamLetter.isLocked ? (isTradeInSelected ? "selected" : "locked") : "idle"} score={teamLetter.score} />
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
