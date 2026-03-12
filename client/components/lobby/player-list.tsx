"use client";

import { Crown } from "lucide-react";
import { User } from "@/lib/game/types";
import { useGameContext } from "@/hooks/gamecontext";

function PlayerAvatar({ name }: { name: string }) {
  const split = name.split(" ");
  return (
    <div className="flex items-center justify-center w-10 h-10 text-lg font-bold rounded-full shrink-0 bg-tile-primary text-tile-foreground drop-shadow-[0_2px_2px_var(--tile-shadow)]">
      {split.length >= 2 ? `${split[0][0]}${split[1][0]}` : name[0]}
    </div>
  );
}

function PlayerCard({ username, isHost, userId }: User & { isHost: boolean }) {
  const { user } = useGameContext();

  if (!user) return null;

  return (
    <div className="flex items-center gap-4 px-4 py-3 transition-all border rounded-xl bg-card border-border hover:border-primary/30">
      <PlayerAvatar name={username} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center">
          <span className={`text-base truncate text-foreground ${user.userId === userId ? "font-extrabold" : "font-bold"}`}>{user.userId === userId ? "Du" : username}</span>
        </div>
      </div>
      {isHost && (
        <div className="flex items-center p-2 rounded-md bg-primary/15">
          <Crown className="size-6 text-primary shrink-0 stroke-3 " />
        </div>
      )}
    </div>
  );
}

export function PlayerList() {
  const { gamestate, user } = useGameContext();

  if (!gamestate || !user) return;

  const teamAPlayers: User[] = [];
  const teamBPlayers: User[] = [];

  Object.keys(gamestate.players).map((key) => {
    if (gamestate.players[key].team === "a") {
      teamAPlayers.push(gamestate.players[key]);
    } else {
      teamBPlayers.push(gamestate.players[key]);
    }
  });

  return (
    <div className="flex-1 p-6 border shadow-sm rounded-2xl bg-card border-border">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-base font-extrabold text-foreground">Lag A</p>
          <span className="text-xs text-muted-foreground">({teamAPlayers.length} spelare)</span>
        </div>
        {teamAPlayers.map((player) => (
          <PlayerCard key={player.userId} {...player} isHost={player.userId === gamestate.host} />
        ))}
        <div className="flex items-center justify-between">
          <p className="text-base font-extrabold text-foreground">Lag B</p>
          <span className="text-xs text-muted-foreground">({teamBPlayers.length} spelare)</span>
        </div>
        {teamBPlayers.map((player) => (
          <PlayerCard key={player.userId} {...player} isHost={player.userId === gamestate.host} />
        ))}
      </div>
    </div>
  );
}
