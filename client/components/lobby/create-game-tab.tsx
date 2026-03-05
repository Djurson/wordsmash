import { Play } from "lucide-react";
import { Button } from "../ui/button";
import { GameSettingsPanel } from "./game-settings";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { GameSettings } from "@/lib/game/types";

interface CreateGameTabProps {
  settings: GameSettings;
  onSettingsChange: (settings: GameSettings) => void;
  username: string;
  onUsernameChange: (username: string) => void;
  handleCreate: () => void;
}

export function CreateGameTab({ ...props }: CreateGameTabProps) {
  return (
    <div className="flex flex-col gap-5 p-6 border shadow-sm rounded-2xl bg-card border-border">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-extrabold text-foreground">Skapa Ett Nytt Spel</h2>
        <p className="text-sm text-muted-foreground">Skapa ett spel och låt dina vänner gå med</p>
      </div>

      <div className="flex flex-col gap-3">
        <Label className="text-sm font-semibold text-foreground" htmlFor="username">
          Namn
        </Label>
        <Input
          placeholder="Ditt namn..."
          value={props.username}
          onChange={(e) => props.onUsernameChange(e.target.value)}
          className="text-lg font-bold tracking-widest text-left bg-card"
          name="username"
        />
      </div>

      <GameSettingsPanel settings={props.settings} onChange={props.onSettingsChange} />

      <Button size="lg" onClick={props.handleCreate} className="w-full text-base font-bold">
        Skapa
        <Play className="w-5 h-5" />
      </Button>
    </div>
  );
}
