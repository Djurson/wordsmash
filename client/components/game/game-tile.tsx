import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LetterTileProps {
  letter: string;
  state?: LetterState;
  zoom?: number;
  delay?: number;
  onClick?: () => void;
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

export default function GameTile({ letter, state = "idle", zoom = 1, onClick, delay }: LetterTileProps) {
  const isActive = state === "idle" || state === "selected";
  const isPlaced = state === "placed";
  const isGhost = state === "selected-hover" || state === "placeholder";
  const isInteractive = !isPlaced && !isGhost;

  const sizeClasses = isInteractive ? "aspect-square size-18 text-3xl cursor-pointer" : "w-full h-full";
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
      style={isPlaced || isGhost ? { fontSize: `${28 * zoom}px` } : undefined}
      className={cn("flex items-center justify-center font-extrabold select-none transition-all duration-150 border-2", sizeClasses, getTileStateClasses(state), hoverClasses)}>
      <span className="leading-none tracking-tight">{letter.toUpperCase()}</span>
    </motion.div>
  );
}
