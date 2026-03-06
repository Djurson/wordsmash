import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 *! SLOPPY AHH CODE TO BE REWRITTEN SOME DAY
 ** Have been adding states etc over and over again
 ** So now I just lost track of how everything works
 */

interface LetterTileProps {
  letter: string;
  team?: "a" | "b";
  state?: "idle" | "placed" | "selected" | "selected-hover" | "placeholder" | "secondary";
  zoom?: number;
  delay?: number;
  onClick?: () => void;
}

export function GameTileSkeleton() {
  return <div className="flex items-center justify-center border-2 rounded-xl aspect-square size-18 bg-tile-primary/40 border-tile-border/40 animate-pulse" />;
}

export default function GameTile({ letter, team, state = "idle", zoom = 1, onClick, delay }: LetterTileProps) {
  const isActive = state === "idle" || state === "selected";
  const isPlaced = state === "placed";
  const isGhost = state === "selected-hover" || state === "placeholder";

  const sizeClasses = !isPlaced && !isGhost ? "aspect-square size-18 text-3xl cursor-pointer" : "w-full h-full";

  const hoverClasses = !isPlaced && !isGhost ? "hover:-translate-y-1 hover:shadow-[0_6px_0_0_var(--tile-shadow),0_8px_16px_rgba(0,0,0,0.2)]" : undefined;

  const stateClasses = isGhost
    ? "rounded-lg font-mono border-dashed border-primary/50 bg-primary/10 text-tile-foreground/60 pointer-events-none animate-wiggle"
    : state === "selected"
      ? "rounded-xl text-tile-foreground ring-4 ring-blue-400/50 -translate-y-2 bg-tile-primary border-tile-border shadow-[0_4px_0_0_var(--tile-shadow),0_6px_12px_rgba(0,0,0,0.15)]"
      : isPlaced && team === "b"
        ? "rounded-xl text-tile-foreground bg-tile-accent border-tile-border shadow-[0_4px_0_0_#cbd5e1,0_4px_6px_-1px_rgba(0,0,0,0.1)]"
        : state === "secondary"
          ? "rounded-xl text-tile-foreground bg-tile-secondary border-tile-border shadow-[0_4px_0_0_var(--tile-shadow),0_6px_12px_rgba(0,0,0,0.15)]"
          : "rounded-xl text-tile-foreground bg-tile-primary border-tile-border shadow-[0_4px_0_0_var(--tile-shadow),0_6px_12px_rgba(0,0,0,0.15)]";

  return (
    <motion.div
      initial={isActive ? { scale: 0.8, opacity: 0 } : { scale: 0, opacity: 0, y: 10 }}
      animate={isActive ? { scale: 1, opacity: 1 } : { scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0, opacity: 0 }}
      whileTap={!isPlaced && !isGhost ? { scale: 0.95 } : undefined}
      transition={!isGhost ? { type: "spring", stiffness: 400, damping: 1500, delay: delay ?? 0 } : { duration: 0.05, delay: delay ?? 0 }}
      onClick={onClick}
      style={isPlaced || isGhost ? { fontSize: `${28 * zoom}px` } : undefined}
      className={cn("flex items-center justify-center font-extrabold select-none transition-all duration-150 border-2", sizeClasses, stateClasses, hoverClasses)}>
      <span className="leading-none tracking-tight">{letter.toUpperCase()}</span>
    </motion.div>
  );
}
