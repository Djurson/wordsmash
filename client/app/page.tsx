"use client";

import { CreateGameTab } from "@/components/lobby/create-game-tab";
import { GameCodeDisplay } from "@/components/lobby/game-code-display";
import { GameSettingsPanel } from "@/components/lobby/game-settings";
import { MenuHeader } from "@/components/lobby/header";
import { JoinTab } from "@/components/lobby/join-tab";
import { PlayerList } from "@/components/lobby/player-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CELL, GenerateGameCode, MOCK_PLAYERS } from "@/lib/utils";
import { ArrowLeft, Play, Sparkles, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { GameSettings } from "@/lib/types";
import { useGameContext } from "@/hooks/websocket";

export default function LobbyPage() {
  const { websocket } = useGameContext();

  const router = useRouter();
  const [tab, setTab] = useState<string>("create");
  const [joinCode, setJoinCode] = useState("");
  const [hasCreated, setHasCreated] = useState(false);
  const [gameCode, setGameCode] = useState("");
  const [settings, setSettings] = useState<GameSettings>({ timerMinutes: 5, enableBombs: true });

  const handleCreate = useCallback(() => {
    setGameCode(GenerateGameCode());
    setHasCreated(true);
  }, []);

  const handleStartGame = useCallback(() => {
    router.push("/game");
  }, [router]);

  return (
    <main className="flex flex-col items-center gap-8 min-h-dvh bg-background">
      <div
        className="fixed inset-0 overflow-hidden touch-none"
        style={{
          backgroundImage: "radial-gradient(circle, var(--canvas-dot, #cbd5e1) 1.5px, transparent 1.5px)",
          backgroundColor: "var(--background, --tile-secondary)",
          backgroundSize: `${CELL}px ${CELL}px`,
          backgroundPosition: `calc(50% + ${CELL / 2}px) calc(50% + ${CELL / 2}px)`,
        }}
      />

      <MenuHeader />

      <div className="z-10 flex items-start justify-center flex-1 w-full pb-10">
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 1200, damping: 40, delay: 0.8 }} className="w-full max-w-md">
          {!hasCreated ? (
            <div className="w-full max-w-md">
              <Tabs value={tab} onValueChange={setTab} className="flex flex-col w-full gap-3">
                <TabsList className="w-full">
                  <TabsTrigger value="create" className="flex-1">
                    <Sparkles className="w-4 h-4" />
                    Skapa Spel
                  </TabsTrigger>
                  <TabsTrigger value="join" className="flex-1">
                    <UserPlus className="w-4 h-4" />
                    Gå Med
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="create">
                  <CreateGameTab settings={settings} handleCreate={handleCreate} setGameSettings={setSettings} />
                </TabsContent>

                <TabsContent value="join">
                  <JoinTab joinCode={joinCode} onCodeChange={(e) => setJoinCode(e)} onStartGame={handleStartGame} />
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex flex-col w-full max-w-4xl gap-6 lg:flex-row">
              <div className="flex flex-col flex-1 gap-5">
                <GameCodeDisplay code={gameCode} />
                <PlayerList players={MOCK_PLAYERS} />
              </div>

              <div className="flex flex-col w-full gap-5 lg:flex-1 lg:justify-between">
                <div className="flex flex-col gap-3 p-6 border shadow-sm rounded-2xl bg-card border-border">
                  {/** //TODO: Add username */}
                  <Label className="text-sm font-semibold text-foreground" htmlFor="username">
                    Namn
                  </Label>
                  <Input
                    placeholder="Ditt namn..."
                    // value={formattedJoinCode}
                    // onChange={(e) => onCodeChange(e.target.value)}
                    className="text-lg font-bold tracking-widest text-left bg-card"
                    name="username"
                  />
                </div>

                <div className="p-6 border shadow-sm rounded-2xl bg-card border-border">
                  <div className="flex flex-col gap-4">
                    <h3 className="text-base font-extrabold text-foreground">Game Settings</h3>
                    <GameSettingsPanel settings={settings} onChange={setSettings} isHost={true} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Button size="lg" onClick={handleStartGame} className="w-full text-base font-bold h-14">
                    Starta
                    <Play className="w-5 h-5" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setHasCreated(false);
                      setGameCode("");
                    }}
                    className="w-full">
                    <ArrowLeft />
                    Tillbaka
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
