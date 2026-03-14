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
import { ArrowLeft, Info, Play, SendHorizonal, Sparkles, UserPlus } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useGameContext } from "@/hooks/gamecontext";
import { CELL } from "@/lib/game/utils";
import { GameSettings } from "@/lib/game/types";
import { LoadingIcon } from "@/components/game/loading";
import { HowToPlay } from "@/components/lobby/how-to-play";
import GuidePage from "@/components/lobby/guide";

const DEFALT_SETTINGS: GameSettings = {
  timerMinutes: 5,
  enableSpecials: true,
  roadblockDuration: 10,
};

export default function LobbyPage() {
  const { gamestate, sendMessage, leaveRoom, user, connectionError, quickGuideOpen, handleUpdateQuickGuide } = useGameContext();

  const [tab, setTab] = useState<string>("create");
  const [joinCode, setJoinCode] = useState("");
  const [username, setUsername] = useState("");
  const [settings, setSettings] = useState<GameSettings>(gamestate?.settings ?? DEFALT_SETTINGS);

  const handleSettingChange = (newSettings: GameSettings) => {
    setSettings(newSettings);
    sendMessage("update_settings", newSettings);
  };

  const handleCreate = () => {
    sendMessage("create_game", { username: username, settings: settings });
  };

  const handleJoin = () => {
    sendMessage("join_game", { gameCode: joinCode, username: username });
  };

  const handleUsernameUpdate = () => {
    sendMessage("update_username", { username: username });
  };

  const handleStartGame = () => {
    if (user?.userId === gamestate?.host) {
      sendMessage("start_game", null);
    }
  };

  if (connectionError) {
    return <LoadingIcon />;
  }

  if (quickGuideOpen) {
    return <GuidePage />;
  }

  return (
    <main className="flex flex-col items-center w-full gap-10 min-h-dvh bg-background">
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

      <div className="z-10 flex flex-col items-center justify-start flex-1 w-full">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 1200, damping: 40, delay: 0.8 }}
          className={`w-full space-y-6 ${gamestate ? "max-w-4xl" : "max-w-md"}`}>
          {!gamestate ? (
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
                  <CreateGameTab
                    settings={settings}
                    handleCreate={handleCreate}
                    onSettingsChange={(newsettings) => setSettings(newsettings)}
                    onUsernameChange={(e) => setUsername(e)}
                    username={username}
                  />
                </TabsContent>

                <TabsContent value="join">
                  <JoinTab joinCode={joinCode} onCodeChange={(e) => setJoinCode(e)} onJoin={handleJoin} onUsernameChange={(e) => setUsername(e)} username={username} />
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex flex-col w-full max-w-4xl gap-6 lg:flex-row">
              <div className="flex flex-col flex-1 gap-5">
                <GameCodeDisplay />
                <PlayerList />
                <div className="flex justify-between w-full max-w-4xl gap-6 itesm-center">
                  <Button className="flex-1" variant="default" onClick={() => handleUpdateQuickGuide(true)}>
                    Snabb Guide <Play />
                  </Button>
                  <HowToPlay>
                    <Button className="flex-1" variant="outline">
                      Hur Spelar Jag? <Info />
                    </Button>
                  </HowToPlay>
                </div>
              </div>

              <div className="flex flex-col w-full gap-5 lg:flex-1 lg:justify-between">
                <div className="flex items-end p-6 border gap-2 shadow-sm rounded-2xl bg-card border-border">
                  <div className="flex flex-col flex-1 gap-3">
                    <Label className="text-sm font-semibold text-foreground" htmlFor="username">
                      Namn
                    </Label>
                    <Input placeholder="Ditt namn..." value={username} onChange={(e) => setUsername(e.target.value)} className="text-lg font-bold tracking-widest text-left bg-card" name="username" />
                  </div>
                  <Button size="icon" onClick={handleUsernameUpdate}>
                    <SendHorizonal />
                  </Button>
                </div>

                <div className="p-6 border shadow-sm rounded-2xl bg-card border-border">
                  <div className="flex flex-col gap-4">
                    <h3 className="text-base font-extrabold text-foreground">Game Settings</h3>
                    <GameSettingsPanel settings={gamestate.settings} onChange={handleSettingChange} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Button size="lg" onClick={handleStartGame} className="w-full text-base font-bold h-14" disabled={user?.userId !== gamestate.host}>
                    Starta
                    <Play className="w-5 h-5" />
                  </Button>

                  <Button variant="outline" size="sm" className="w-full" onClick={leaveRoom}>
                    <ArrowLeft />
                    Tillbaka
                  </Button>
                </div>
              </div>
            </div>
          )}
          {!gamestate && (
            <motion.div
              initial={!user ? { scale: 0, opacity: 0 } : {}}
              animate={!user ? { scale: 1, opacity: 1 } : {}}
              transition={!user ? { type: "spring", stiffness: 800, damping: 20, delay: 1.1 } : {}}
              className="flex justify-between w-full max-w-4xl gap-4 itesm-center">
              <Button className="flex-1" variant="default" onClick={() => handleUpdateQuickGuide(true)}>
                Snabb Guide <Play />
              </Button>
              <HowToPlay>
                <Button className="flex-1" variant="outline">
                  Hur Spelar Jag? <Info />
                </Button>
              </HowToPlay>
            </motion.div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
