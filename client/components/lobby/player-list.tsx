"use client";

import { Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Player {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  team: "A" | "B";
}

interface PlayerListProps {
  players: Player[];
}

function PlayerAvatar({ name, avatar }: { name: string; avatar: string }) {
  return (
    <div className="flex items-center justify-center w-10 h-10 text-lg font-bold rounded-full shrink-0 bg-tile-primary text-tile-foreground drop-shadow-[0_2px_2px_var(--tile-shadow)]">{avatar}</div>
  );
}

function PlayerCard(player: Player) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 transition-all border rounded-xl bg-card border-border hover:border-primary/30">
      <PlayerAvatar name={player.name} avatar={player.avatar} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold truncate text-foreground">{player.name}</span>
          {player.isHost && <Crown className="w-3.5 h-3.5 text-primary shrink-0" />}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {player.isReady ? (
          <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">Ready</Badge>
        ) : (
          <Badge variant="outline" className="text-[10px]">
            Waiting
          </Badge>
        )}
      </div>
    </div>
  );
}

export function PlayerList({ players }: PlayerListProps) {
  return (
    <div className="p-6 border shadow-sm rounded-2xl bg-card border-border">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-base font-extrabold text-foreground">Lag A</p>
          <span className="text-xs text-muted-foreground">({players.filter((player) => player.team === "A").length} spelare)</span>
        </div>
        {players
          .filter((player) => player.team === "A")
          .map((player) => (
            <PlayerCard key={player.id} {...player} />
          ))}
        <div className="flex items-center justify-between">
          <p className="text-base font-extrabold text-foreground">Lag B</p>
          <span className="text-xs text-muted-foreground">({players.filter((player) => player.team === "B").length} spelare)</span>
        </div>
        {players
          .filter((player) => player.team === "B")
          .map((player) => (
            <PlayerCard key={player.id} {...player} />
          ))}
      </div>
    </div>
  );
}
