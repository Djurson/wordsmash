"use client";

import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Timer, Bomb, Construction } from "lucide-react";
import { GameSettings } from "@/lib/game/types";
import { useGameContext } from "@/hooks/gamecontext";
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";

interface GameSettingsProps {
  settings: GameSettings;
  onChange: (settings: GameSettings) => void;
}

export function GameSettingsPanel({ settings, onChange }: GameSettingsProps) {
  const update = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  const { gamestate, user } = useGameContext();

  const isDisabled = gamestate?.host ? !(gamestate.host === user?.userId) : false;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center text-sm font-semibold gap-2 text-foreground">
          <Timer className="w-4 h-4 text-muted-foreground" />
          Speltid
        </div>
        <div className="flex items-center gap-4">
          <Slider value={[settings.timerMinutes]} onValueChange={([v]) => update("timerMinutes", v)} min={1} max={25} step={1} disabled={isDisabled} className="flex-1" />
          <span className="w-12 text-sm font-bold text-right text-foreground tabular-nums">{settings.timerMinutes} min</span>
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center text-sm font-semibold gap-2 text-foreground">
          <Timer className="w-4 h-4 text-muted-foreground" />
          Spärrtid
        </div>
        <div className="flex items-center gap-4">
          <Slider
            value={[settings.roadblockDuration]}
            onValueChange={([v]) => update("roadblockDuration", v)}
            min={5}
            max={30}
            step={5}
            disabled={isDisabled || !settings.enableSpecials}
            className="flex-1"
          />
          <span className="w-12 text-sm font-bold text-right text-foreground tabular-nums">{settings.roadblockDuration} sek</span>
        </div>
      </div>

      <div className="flex gap-2.5 w-full justify-between items-center">
        <span className="text-sm font-semibold text-foreground">Special</span>
        <div className="flex items-center gap-3">
          <AnimatePresence>
            {settings.enableSpecials && (
              <motion.div className="flex gap-1.5" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                <span className="flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded-md">
                  <Bomb className="w-3 h-3" /> Bombs
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                  <Construction className="w-3 h-3" /> Blocks
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          <Switch size="default" checked={settings.enableSpecials} onCheckedChange={() => update("enableSpecials", !settings.enableSpecials)} disabled={isDisabled} />
        </div>
      </div>
    </div>
  );
}
