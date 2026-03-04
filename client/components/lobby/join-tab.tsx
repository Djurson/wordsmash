import { ChangeEvent, useMemo } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";

interface JoinTabProps {
  joinCode: string;
  onCodeChange: (e: string) => void;
  onStartGame: () => void;
}

export function JoinTab({ joinCode, onCodeChange, onStartGame }: JoinTabProps) {
  const formattedJoinCode = useMemo(() => {
    const clean = joinCode.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8);
    if (clean.length > 4) {
      return `${clean.slice(0, 4)}-${clean.slice(4)}`;
    }
    return clean;
  }, [joinCode]);

  const isJoinCodeValid = formattedJoinCode.length === 9;

  return (
    <div className="flex flex-col gap-5 p-6 border shadow-sm rounded-2xl bg-card border-border">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-extrabold text-foreground">Gå Med I Ett Spel</h2>
        <p className="text-sm text-muted-foreground">Skriv in koden din vän delat med dig</p>
      </div>

      <div className="flex flex-col gap-3">
        <Label className="text-sm font-semibold text-foreground" htmlFor="username">
          Namn
        </Label>
        <Input
          placeholder="Ditt namn..."
          // TODO: Implement username
          // value={formattedJoinCode}
          // onChange={(e) => onCodeChange(e.target.value)}
          className="text-lg font-bold tracking-widest text-left bg-card"
          name="username"
        />
      </div>

      <div className="flex flex-col gap-3">
        <Label className="text-sm font-semibold text-foreground" htmlFor="game-code">
          Spelkod
        </Label>
        <Input
          placeholder="e.g. AbC1-xY2z"
          value={formattedJoinCode}
          onChange={(e) => onCodeChange(e.target.value)}
          className="text-lg font-bold tracking-widest text-center bg-card"
          maxLength={9}
          name="game-code"
        />
        <p className="text-xs text-center text-muted-foreground">Format: XXXX-XXXX (bokstäver och nummer, skiftlägeskänslig)</p>
      </div>

      <Button size="lg" onClick={() => onStartGame} disabled={!isJoinCodeValid} className="w-full text-base font-bold">
        Gå Med
        <ArrowRight className="w-5 h-5" />
      </Button>
    </div>
  );
}
