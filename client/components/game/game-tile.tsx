import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Bomb, CircleX, Construction } from "lucide-react";
import { useEffect, useState } from "react";

interface LetterTileProps {
  letter?: string;
  state?: LetterState;
  score?: number;
  delay?: number;
  expiresAt?: number;
  onClick?: () => void;
  onRemove?: (e: React.MouseEvent) => void;
}

type LetterState = "idle" | "placed" | "selected" | "selected-hover" | "placeholder" | "secondary" | "locked" | "roadblock" | "roadblock-hover" | "bomb-hover" | "bomb-placed";

export function GameTileSkeleton() {
  return <div className="flex items-center justify-center border-2 rounded-xl aspect-square size-18 bg-tile-primary/40 border-tile-border/40 animate-pulse" />;
}

const BASE_TILE = "rounded-xl text-tile-foreground border-tile-border";
const DEFAULT_SHADOW = "shadow-[0_4px_0_0_var(--tile-shadow),0_6px_12px_rgba(0,0,0,0.15)]";

function getTileStateClasses(state: LetterState): string {
  switch (state) {
    case "selected-hover":
    case "placeholder":
      return "rounded-lg font-mono border-dashed border-primary/50 bg-primary/10 text-tile-foreground/60 pointer-events-none animate-wiggle";
    case "selected":
      return cn(BASE_TILE, "ring-4 ring-blue-400/50 -translate-y-2 bg-tile-primary", DEFAULT_SHADOW);
    case "secondary":
      return cn(BASE_TILE, "bg-tile-secondary", DEFAULT_SHADOW);
    case "locked":
      return "rounded-xl text-tile-foreground border-tile-foreground/20 bg-tile-locked shadow-[0_4px_0_0_var(--tile-locked),0_6px_12px_rgba(0,0,0,0.15)]";
    case "roadblock":
      return "rounded-xl border-2 border-[#dc2626] bg-bomb-red/90 shadow-lg";
    case "roadblock-hover":
      return "rounded-xl border-2 border-dashed border-bomb-red bg-bomb-red/15 pointer-events-none";
    case "bomb-hover":
      return "rounded-xl border-3 border-bomb-red bg-bomb-red/30 shadow-[0_0_20px_rgba(239,68,68,0.5)] pointer-events-none";
    case "bomb-placed":
      return "rounded-xl border-3 border-bomb-red bg-bomb-red/60 shadow-[0_0_20px_rgba(239,68,68,0.5)] pointer-events-none";
    default:
      return cn(BASE_TILE, "bg-tile-primary", DEFAULT_SHADOW);
  }
}

export default function GameTile({ letter, score, state = "idle", onClick, delay, onRemove, expiresAt }: LetterTileProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!expiresAt) return;

    const calculateTimeLeft = () => {
      const difference = expiresAt - Date.now();
      if (difference <= 0) {
        setTimeLeft(0);
        return;
      }
      setTimeLeft(Math.ceil(difference / 1000));
    };

    calculateTimeLeft(); // Kör direkt
    const interval = setInterval(calculateTimeLeft, 500); // Uppdatera varje halva sekund

    return () => clearInterval(interval);
  }, [expiresAt]);

  const isActive = state === "idle" || state === "selected";
  const isPlaced = state === "placed";
  const isGhost = state === "selected-hover" || state === "placeholder" || state === "roadblock-hover" || state === "bomb-hover" || state === "bomb-placed";
  const isInteractive = !isPlaced && !isGhost && state !== "roadblock";

  const sizeClasses = isInteractive ? "aspect-square size-18 cursor-pointer" : "w-full h-full";
  const hoverClasses =
    isInteractive && state !== "locked" ? "hover:-translate-y-1 hover:shadow-[0_6px_0_0_var(--tile-shadow),0_8px_16px_rgba(0,0,0,0.2)]" : state === "locked" ? "cursor-not-allowed" : undefined;

  /* TRANSITIONS */
  const initial = isActive ? { scale: 0.8, opacity: 0 } : { scale: 0, opacity: 0, y: 10 };
  const animate = isActive ? { scale: 1, opacity: 1 } : { scale: 1, opacity: 1, y: 0 };
  const transition = isGhost ? { duration: 0.05, delay: delay ?? 0 } : { type: "spring" as const, stiffness: 400, damping: 1500, delay: delay ?? 0 };

  const isStandardLetter = state !== "roadblock" && state !== "roadblock-hover" && state !== "bomb-hover" && state !== "bomb-placed" && letter;

  return (
    <motion.div
      initial={initial}
      animate={animate}
      exit={{ scale: 0, opacity: 0 }}
      whileTap={isInteractive ? { scale: 0.95 } : undefined}
      transition={transition}
      onClick={onClick}
      className={cn("relative flex items-center justify-center font-extrabold select-none transition-all duration-150 border-2 text-3xl", sizeClasses, getTileStateClasses(state), hoverClasses)}>
      {/* LETTER TILE */}
      {isStandardLetter && (
        <>
          <span className="leading-none tracking-tight">{letter.toUpperCase()}</span>
          <span className={`absolute bottom-1.5 right-2 text-xs font-bold ${state === "placeholder" || state === "selected-hover" ? "text-tile-foreground/60" : " text-tile-foreground"}`}>
            {score}
          </span>
        </>
      )}

      {/* 2. PLACED ROADBLOCK */}
      {state === "roadblock" && (
        <>
          <Construction className="w-8 h-8 text-white drop-shadow-md" />
          {expiresAt !== undefined && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white/90 bg-black/30 rounded px-1.5 py-0.5">{timeLeft}s</div>}
        </>
      )}

      {/* 3. GHOST PREVIEWS & BOMB PLACED*/}
      {state === "roadblock-hover" && <Construction className="text-red-400 w-7 h-7 opacity-60" />}
      {(state === "bomb-hover" || state === "bomb-placed") && <Bomb className="text-red-500 size-10 aspect-square animate-pulse z-50" />}

      {/* REMOVE BUTTON */}
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute z-20 p-1 transition-all duration-300 transform rounded-full shadow-sm -top-2 -right-2 bg-destructive text-destructive-foreground hover:scale-110">
          <CircleX className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
}
