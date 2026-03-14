"use client";

import { ArrowLeft, ArrowRight, Bomb, ChevronLeft, ChevronRight, Construction, LayoutGrid, Play, Send, Timer, Trophy, Users, WholeWord, X, Zap } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import GameTile from "@/components/game/game-tile";
import { useCallback, useEffect, useState } from "react";
import { CELL, TILE_SIZE } from "@/lib/game/utils";
import { HUDTimer } from "@/components/game/top-hud";
import { useGameContext } from "@/hooks/gamecontext";
import { Kbd } from "../ui/kbd";
import { Button } from "../ui/button";

const STEPS = [
  { id: "intro", title: "Välkommen Till Wordsmash", icon: WholeWord },
  { id: "teams", title: "Spela I Lag", icon: Users },
  { id: "start", title: "Startordet", icon: Play },
  { id: "build", title: "Bygg Ord Dina Ord", icon: Send },
  { id: "scoring", title: "Poängsystem", icon: Trophy },
  { id: "control", title: "Kontroll Över Brädet", icon: LayoutGrid },
  { id: "bombs", title: "Power-Up: Bomber", icon: Bomb },
  { id: "blocks", title: "Power-Up: Spärrar", icon: Construction },
  { id: "timer", title: "Tiden Tickar", icon: Timer },
  { id: "win", title: "Vinn Spelet", icon: Trophy },
];

const fadeSlide = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -30 },
  transition: { duration: 0.4, ease: "easeOut" as const },
};

type GuideStepProps = {
  onNext?: () => void;
};

const StepIntro = () => (
  <div className="flex flex-col items-center gap-8">
    <div className="flex gap-8">
      <motion.div {...fadeSlide} className="flex gap-3">
        {"WORD".split("").map((l, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: i * 0.1, type: "spring", stiffness: 500 }}
            style={{ width: TILE_SIZE, height: TILE_SIZE }}>
            <GameTile letter={l} score={Math.abs(Math.round(4 - (i * 3) / 2) + 1)} />
          </motion.div>
        ))}
      </motion.div>
      <motion.div {...fadeSlide} className="flex gap-3">
        {"SMASH".split("").map((l, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.4 + i * 0.1, type: "spring", stiffness: 500 }}
            style={{ width: TILE_SIZE, height: TILE_SIZE }}>
            <GameTile letter={l} state="secondary" score={Math.abs(Math.round(4 - (i * 3) / 2) + 1)} />
          </motion.div>
        ))}
      </motion.div>
    </div>
    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="max-w-md text-lg text-center text-muted-foreground">
      Ett ordspel i realtid där lag tävlar mot varandra. Tänk <span className="font-semibold text-primary">Wordfeud</span> möter <span className="font-semibold text-tile-border">Bananagrams</span> men
      snabbare, tillsammans och lite mer kaos.
    </motion.p>
  </div>
);

const StepTeams = () => (
  <div className="flex flex-col items-center gap-8">
    <div className="flex items-center gap-12">
      {/* Team 1 */}
      <motion.div initial={{ x: -60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", delay: 0.1 }} className="flex flex-col items-center gap-3">
        <div className="w-4 h-4 rounded-full bg-team-a glow-a" />
        <span className="text-sm font-bold tracking-wider uppercase text-primary">Lag 1</span>
        <div className="flex gap-2">
          {["L", "A", "G"].map((name, i) => (
            <motion.div
              key={name}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + i * 0.1, type: "spring" }}
              className="flex items-center justify-center w-10 h-10 text-xs font-bold border rounded-full bg-tile-primary border-tile-border text-tile-foreground">
              {name[0]}
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5, type: "spring" }} className="text-3xl font-bold text-muted-foreground">
        VS
      </motion.span>

      {/* Team 2 */}
      <motion.div initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", delay: 0.1 }} className="flex flex-col items-center gap-3">
        <div className="w-4 h-4 rounded-full bg-team-b glow-b" />
        <span className="text-sm font-bold tracking-wider uppercase text-tile-accent">Lag 2</span>
        <div className="flex gap-2">
          {["L", "A", "G"].map((name, i) => (
            <motion.div
              key={name}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3 + i * 0.1, type: "spring" }}
              className="flex items-center justify-center w-10 h-10 text-xs font-bold border rounded-full bg-tile-accent border-tile-border text-tile-foreground">
              {name[0]}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="max-w-sm text-center text-muted-foreground">
      Spelare delas upp i <span className="font-semibold text-foreground">två lag</span>. Alla spelar samtidigt i realtid, så du ser både dina lagkamraters och motståndarnas drag direkt.
    </motion.p>
  </div>
);

const StepStart = () => {
  const [revealed, setRevealed] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setRevealed((p) => Math.min(p + 1, 6)), 300);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col items-center gap-8">
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm tracking-wider uppercase text-muted-foreground">
        När matchen börjar dyker ett slumpmässigt ord upp på brädet....
      </motion.p>
      <div className="flex gap-3">
        {"BÖRJAN".split("").map((l, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, rotateY: 180 }}
            animate={revealed > i ? { scale: 1, rotateY: 0 } : { scale: 0.8, rotateY: 180 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            style={{ width: TILE_SIZE, height: TILE_SIZE }}>
            <GameTile letter={revealed > i ? l : ""} state={revealed > i ? "placed" : "selected-hover"} score={Math.abs(Math.round(4 - (i * 3) / 2) + 1)} />
          </motion.div>
        ))}
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }} className="flex items-center gap-2 text-muted-foreground">
        <Zap className="w-4 h-4 text-primary" />
        <span>Båda lagen bygger vidare från ordet för att skapa nya ord och få poäng.</span>
      </motion.div>
    </div>
  );
};

const StepBuild = ({ onNext }: GuideStepProps) => {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const timers = [setTimeout(() => setPhase(1), 600), setTimeout(() => setPhase(2), 1200), setTimeout(() => setPhase(3), 1800), setTimeout(() => setPhase(4), 2400)];
    return () => timers.forEach(clearTimeout);
  }, []);

  const rackLetters = ["R", "E", "Ö", "D", "D", "E", "S"];
  const placedWord = "BRÖD";
  const startWord = "BÖRJAN";

  return (
    <div className="flex flex-col items-center h-full gap-6">
      <p className="max-w-sm text-sm text-center text-muted-foreground">
        Placera <span className="font-semibold text-tile-foreground">brickor</span> på brädet och bygg ditt ord. Tryck på <span className="font-bold text-primary">Klar</span> för att bekräfta och få
        poäng!
      </p>

      {/* Rack */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-2 px-4 py-3 border rounded-2xl bg-card/95 backdrop-blur-md border-border">
        {rackLetters.map((l, i) => {
          const isUsed = (phase > 0 && i === 0) || i === 2 || i === 3;
          return (
            <motion.div key={i} animate={isUsed ? { scale: 0.8, opacity: 0.3 } : { scale: 1, opacity: 1 }}>
              <GameTile letter={l} state={isUsed ? "locked" : "idle"} score={Math.abs(Math.round(4 - (i * 3) / 2) + 1)} />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Board preview */}
      <div className="relative">
        {/* Existing word PLANT */}
        <div className="flex gap-3 mb-1">
          {startWord.split("").map((l, i) => (
            <div key={`base-${i}`} style={{ width: TILE_SIZE, height: TILE_SIZE }}>
              <GameTile letter={l} state="placed" score={Math.abs(Math.round(4 - (i * 3) / 2) + 1)} />
            </div>
          ))}
        </div>
        {/* Building downward from P */}
        <div className="absolute left-0 flex flex-col gap-3 top-10" style={{ top: CELL }}>
          {placedWord
            .split("")
            .slice(1)
            .map((l, i) => (
              <motion.div
                key={`place-${i}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={phase > i ? { scale: 1, opacity: 1 } : {}}
                transition={{ type: "spring", stiffness: 400 }}
                style={{ width: TILE_SIZE, height: TILE_SIZE }}>
                <GameTile letter={l} state={"placeholder"} score={i + 1} />
              </motion.div>
            ))}
        </div>
      </div>

      {/* Submit button animation */}
      <AnimatePresence>
        {phase >= 3 && (
          <motion.button
            type="button"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={onNext}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold cursor-pointer rounded-xl bg-primary text-primary-foreground">
            <Send className="w-4 h-4" />
            Klar
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

const StepScoring = () => {
  const examples = [
    { word: "ÅT", pts: 2, label: "Kort ord" },
    { word: "SKOR", pts: Math.round("SKOR".length * Math.pow(1.2, "SKOR".length - 2)), label: "4 bokstäver" },
    { word: "SPORT", pts: Math.round("SPORT".length * Math.pow(1.2, "SPORT".length - 2)), label: "5 bokstäver" },
    { word: "SPORTER", pts: Math.round("SPORTER".length * Math.pow(1.2, "SPORTER".length - 2)), label: "7 bokstäver" },
  ];

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="w-full space-y-3">
        {examples.map((ex, i) => (
          <motion.div
            key={ex.word}
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.2 }}
            className="flex items-center gap-3 p-3 border rounded-xl bg-card border-border">
            <div className="flex gap-1">
              {ex.word.split("").map((l, j) => (
                <div key={j} style={{ width: TILE_SIZE, height: TILE_SIZE }}>
                  <GameTile letter={l} state="placed" score={1} />
                </div>
              ))}
            </div>
            <div className="flex-1" />
            <div className="text-right">
              <div className="font-mono text-lg font-bold text-primary">+{ex.pts}</div>
              <div className="text-[10px] text-muted-foreground">{ex.label}</div>
            </div>
          </motion.div>
        ))}
      </div>
      <p className="max-w-sm text-sm text-center text-muted-foreground">
        <span className="font-black text-primary">Längre ord</span> = mer poäng. Så försök göra både långa ord och smarta utbyggnader.
      </p>
    </div>
  );
};

const StepControl = () => {
  const [aCount, setACount] = useState(0);
  const [bCount, setBCount] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setACount((p) => Math.min(p + 3, 32));
      setBCount((p) => Math.min(p + 2, 16));
    }, 200);
    return () => clearInterval(t);
  }, []);

  const total = aCount + bCount || 1;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Mini board visualization */}
      <div className="grid grid-cols-8 gap-0.5">
        {Array.from({ length: 48 }).map((_, i) => {
          const isA = i < aCount;
          const isB = i >= 32 && i < 32 + bCount;
          return (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={isA || isB ? { scale: 1 } : { scale: 0.3 }}
              transition={{ delay: i * 0.03 }}
              className={`w-5 h-5 rounded ${isA && "bg-tile-primary"} ${isB && "bg-tile-accent"} ${!isA && !isB && "bg-muted/30"}`}
            />
          );
        })}
      </div>

      {/* Control bar */}
      <div className="w-64">
        <div className="flex justify-between mb-1 text-xs text-muted-foreground">
          <span className="font-mono font-black text-tile-primary">{aCount} tiles</span>
          <span className="font-mono font-black text-tile-accent">{bCount} tiles</span>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-muted">
          <motion.div className="h-full bg-tile-primary" animate={{ width: `${(aCount / total) * 100}%` }} />
          <motion.div className="h-full bg-tile-accent" animate={{ width: `${(bCount / total) * 100}%` }} />
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-tile-primary border-tile-border/20">
        <span className="flex items-center gap-1 text-sm">
          +1 <Bomb className="size-4" />
        </span>
        <span className="flex items-center gap-1 text-sm">
          +2 <Construction className="size-4" />
        </span>
      </div>

      <p className="max-w-sm text-sm text-center text-muted-foreground">
        Laget med <span className="font-bold text-foreground">flest placerade brickor</span> på brädet får fler powerups. Det handlar alltså inte om poäng här utan om hur mycket plats ni kontrollerar.
      </p>
    </div>
  );
};

const StepBombs = () => {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">
        <div className="flex gap-1">
          <AnimatePresence>
            {"STORM".split("").map((l, i) => {
              return (
                <motion.div key={i} transition={{ type: "spring" }} style={{ width: TILE_SIZE, height: TILE_SIZE }}>
                  {i === 0 && (
                    <div style={{ position: "absolute", inset: 0, width: TILE_SIZE, height: TILE_SIZE, zIndex: 40 }}>
                      <GameTile state="bomb-placed" delay={0.7} />
                    </div>
                  )}
                  {/* LETTER */}
                  <GameTile letter={l} state="placed" score={1} />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <p className="max-w-sm text-sm text-center text-muted-foreground">
        Du kan placera <span className="font-semibold text-destructive">bomber</span> på brickor som redan ligger på brädet. Du kan bara se{" "}
        <span className="font-semibold text-foreground">ditt lags</span> bomber, motståndarna märker dem först när de bygger ett ord där!
      </p>
    </div>
  );
};

const StepBlocks = () => {
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setBlocked(true), 1000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Mini canvas showing block placement */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 21 }).map((_, i) => {
          const isWord = [8, 9, 10, 11].includes(i);
          const isBlock = blocked && [5, 12, 15, 19].includes(i);
          return (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-mono font-bold ${isWord && "bg-tile-primary border border-tile-border text-tile-foreground"} ${isBlock && "border-[#dc2626] bg-bomb-red/90 shadow-lg"} ${!isWord && !isBlock && "bg-muted/20 border border-border/30"}`}>
              {isWord && "WAVE"[i - 8]}
              {isBlock && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
                  <Construction className="w-4 h-4 text-white drop-shadow-md" />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      <p className="max-w-sm text-sm text-center text-muted-foreground">
        Du kan placera <span className="font-semibold text-destructive">spärrar</span> kan placeras på valfri tom ruta. De blockerar <span className="font-semibold text-foreground">alla</span> från
        att använda rutan i ett antal sekunder.
      </p>
    </div>
  );
};

const StepTimer = () => {
  const [timeLeft, setTimeLeft] = useState(120 * 1000);
  useEffect(() => {
    const speedFactor = 10;
    const intervalMs = 5;

    const t = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - intervalMs * speedFactor));
    }, intervalMs);

    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex flex-col items-center gap-6">
      <HUDTimer timeLeft={timeLeft} />
      {/* <ScoreBar teamAScore={142} teamBScore={118} timeLeft={`${mins}:${secs.toString().padStart(2, "0")}`} round={1} totalRounds={1} /> */}
      <p className="max-w-sm text-sm text-center text-muted-foreground">
        Innan matchen startar väljer man hur länge <span className="font-semibold text-foreground">spelet</span> ska pågå. När tiden är slut är matchen slut.
      </p>
    </div>
  );
};

const StepWin = () => {
  const { handleUpdateQuickGuide } = useGameContext();
  return (
    <div className="flex flex-col items-center gap-6">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
        <Trophy className="w-20 h-20 text-primary" />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-center">
        <div className="mb-2 text-2xl font-bold text-foreground">Mest Poäng Vinner!</div>
        <p className="max-w-sm text-muted-foreground">Bygg ord, expandera dem, kontrollera brädet och använd powerups smart och få mer poäng än motståndar laget innan tiden tar slut.</p>
      </motion.div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="flex gap-3 mt-4 cursor-pointer">
        <div
          onClick={() => handleUpdateQuickGuide(false)}
          className="flex items-center gap-2 px-6 py-3 text-sm font-bold transition-opacity rounded-xl bg-primary text-primary-foreground hover:opacity-90">
          Prova Spela <ArrowRight className="size-4" />
        </div>
      </motion.div>
    </div>
  );
};

const STEP_COMPONENTS: Record<string, React.ComponentType<GuideStepProps>> = {
  intro: StepIntro,
  teams: StepTeams,
  start: StepStart,
  build: StepBuild,
  scoring: StepScoring,
  control: StepControl,
  bombs: StepBombs,
  blocks: StepBlocks,
  timer: StepTimer,
  win: StepWin,
};

export default function GuidePage() {
  const [step, setStep] = useState(0);
  const { handleUpdateQuickGuide } = useGameContext();

  const current = STEPS[step];
  const StepComponent = STEP_COMPONENTS[current.id];
  const Icon = current.icon;

  const next = useCallback(() => setStep((p) => Math.min(p + 1, STEPS.length - 1)), []);
  const prev = useCallback(() => setStep((p) => Math.max(p - 1, 0)), []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [next, prev]);

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-background z-100">
      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <motion.div className="h-full bg-primary" animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }} transition={{ type: "spring", stiffness: 200 }} />
      </div>

      {/* Step dots */}
      <div className="flex items-center justify-center gap-2 py-4">
        {STEPS.map((s, i) => (
          <button key={s.id} onClick={() => setStep(i)} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-primary" : i < step ? "bg-primary/50" : "bg-muted"}`} />
        ))}
      </div>

      {/* Header */}
      <motion.div key={current.id + "-header"} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">{current.title}</h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute flex items-center justify-center gap-2 p-2 font-medium duration-300 ease-in-out border rounded-full shadow-sm cursor-pointer right-12 top-12 border-slate-200 text-slate-500 bg-white/90 hover:shadow-lg"
        onClick={() => handleUpdateQuickGuide(false)}>
        <X />
      </motion.div>

      <div className="mb-4 text-xs text-center text-muted-foreground">
        Steg {step + 1} av {STEPS.length}
      </div>

      {/* Content */}
      <div className="flex items-center justify-center flex-1 h-full px-8 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col justify-center w-full h-full max-w-2xl">
            <StepComponent onNext={next} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-8 py-4">
        <Button onClick={prev} disabled={step === 0} variant="outline" className="flex items-center gap-2 px-4 rounded-xl ">
          <ChevronLeft className="w-4 h-4" />
          Föregående
        </Button>
        <span className="flex items-center justify-center gap-1 font-mono text-xs text-muted-foreground">
          <Kbd>
            <ArrowLeft className="size-3" />
          </Kbd>
          <Kbd>
            <ArrowRight className="size-3" />
          </Kbd>
          eller
          <Kbd className="px-2">
            <span>mellanslag</span>
          </Kbd>
          för att navigera
        </span>
        <Button onClick={next} disabled={step === STEPS.length - 1} className="flex items-center gap-2 px-4 font-semibold rounded-xl">
          Nästa
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
