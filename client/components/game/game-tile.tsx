import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CircleX } from "lucide-react";

interface LetterTileProps {
  letter: string;
  state?: LetterState;
  score?: number;
  delay?: number;
  onClick?: () => void;
  onRemove?: (e: React.MouseEvent) => void;
}

type LetterState = "idle" | "placed" | "selected" | "selected-hover" | "placeholder" | "secondary" | "locked";

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

    /* STATE === "IDLE" */
    default:
      return cn(BASE_TILE, "bg-tile-primary", DEFAULT_SHADOW);
  }
}

export default function GameTile({ letter, score, state = "idle", onClick, delay, onRemove }: LetterTileProps) {
  const isActive = state === "idle" || state === "selected";
  const isPlaced = state === "placed";
  const isGhost = state === "selected-hover" || state === "placeholder";
  const isInteractive = !isPlaced && !isGhost;

  const sizeClasses = isInteractive ? "aspect-square size-18 cursor-pointer" : "w-full h-full";
  const hoverClasses =
    isInteractive && state !== "locked" ? "hover:-translate-y-1 hover:shadow-[0_6px_0_0_var(--tile-shadow),0_8px_16px_rgba(0,0,0,0.2)]" : state === "locked" ? "cursor-not-allowed" : undefined;

  /* TRANSITIONS */
  const initial = isActive ? { scale: 0.8, opacity: 0 } : { scale: 0, opacity: 0, y: 10 };
  const animate = isActive ? { scale: 1, opacity: 1 } : { scale: 1, opacity: 1, y: 0 };
  const transition = isGhost ? { duration: 0.05, delay: delay ?? 0 } : { type: "spring" as const, stiffness: 400, damping: 1500, delay: delay ?? 0 };

  return (
    <motion.div
      initial={initial}
      animate={animate}
      exit={{ scale: 0, opacity: 0 }}
      whileTap={isInteractive ? { scale: 0.95 } : undefined}
      transition={transition}
      onClick={onClick}
      className={cn("relative flex items-center justify-center font-extrabold select-none transition-all duration-150 border-2 text-3xl", sizeClasses, getTileStateClasses(state), hoverClasses)}>
      <span className="leading-none tracking-tight">{letter.toUpperCase()}</span>
      <span className={`absolute bottom-1.5 right-2 text-xs font-bold ${state === "placeholder" || state === "selected-hover" ? "text-tile-foreground/60" : " text-tile-foreground"}`}>{score}</span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute z-20 p-1 transition-all duration-300 ease-in-out rounded-full shadow-md cursor-pointer text-tile-foreground bg-tile-locked -top-2 -right-2 shadow-tile-foreground/60 hover:scale-110 hover:bg-red-600 hover:text-white">
          <CircleX className="size-4" />
        </button>
      )}
    </motion.div>
  );
}
