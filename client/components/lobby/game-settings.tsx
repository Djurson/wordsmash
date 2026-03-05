"use client";

import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Timer, Bomb } from "lucide-react";
import { GameSettings } from "@/lib/game/types";
import { useGameContext } from "@/hooks/websocket";

interface GameSettingsProps {
  settings: GameSettings;
  onChange: (settings: GameSettings) => void;
}

const POWER_UPS = [
  {
    key: "enableBombs" as const,
    label: "Bomber",
    description: "Placera bomber på ordbrickor",
    icon: Bomb,
    color: "#38bdf8",
  },
];

export function GameSettingsPanel({ settings, onChange }: GameSettingsProps) {
  const update = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  const { gamestate, user } = useGameContext();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Timer className="w-4 h-4 text-muted-foreground" />
          Speltid
        </div>
        <div className="flex items-center gap-4">
          <Slider value={[settings.timerMinutes]} onValueChange={([v]) => update("timerMinutes", v)} min={2} max={15} step={1} disabled={!(gamestate?.host === user?.userId)} className="flex-1" />
          <span className="w-12 text-sm font-bold text-right text-foreground tabular-nums">{settings.timerMinutes} min</span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="text-sm font-semibold text-foreground">Special regler</span>
        <div className="flex flex-col gap-2">
          {POWER_UPS.map((powerUp) => {
            const Icon = powerUp.icon;
            const enabled = settings[powerUp.key];
            return (
              <div
                key={powerUp.key}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl bg-card border-2 border-border ease-in-out duration-150 ${enabled ? "border-tile-primary bg-tile-primary/5 border-2" : ""}`}>
                <div className={`p-2 rounded-lg flex items-center justify-center shrink-0 ${enabled ? "border-tile-primary bg-tile-primary/20" : ""}`}>
                  <Icon className={`w-5 h-5 ${enabled ? "text-tile-foreground stroke-3" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground">{powerUp.label}</div>
                  <div className="text-xs text-muted-foreground">{powerUp.description}</div>
                </div>
                <Switch checked={enabled} onCheckedChange={(e) => update(powerUp.key, e)} disabled={!(gamestate?.host === user?.userId)} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
