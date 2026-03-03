import { motion } from "framer-motion";

interface LetterTileProps {
  letter: string;
  team?: "a" | "b";
  state?: "idle" | "placed" | "selected" | "selected-hover" | "placeholder";
  zoom?: number;
  onClick?: () => void;
}

export function GameTileSkeleton() {
  return <div className="flex items-center justify-center rounded-xl border-2 aspect-square size-18 bg-tile-primary/40 border-tile-border/40 animate-pulse" />;
}

export default function GameTile({ letter, team, state = "idle", zoom = 1, onClick }: LetterTileProps) {
  const isActive = state === "idle" || state === "selected";
  const isPlaced = state === "placed";
  const isHoverGhost = state === "selected-hover" || state === "placeholder";

  return (
    <motion.div
      initial={isActive ? { scale: 0.8, opacity: 0 } : { scale: 0, opacity: 0, y: 10 }}
      animate={isActive ? { scale: 1, opacity: 1 } : { scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0, opacity: 0 }}
      whileTap={!isPlaced && !isHoverGhost ? { scale: 0.95 } : undefined}
      transition={!isHoverGhost ? { type: "spring", stiffness: 400, damping: 1500 } : { duration: 0.05 }}
      onClick={onClick}
      style={
        isPlaced || isHoverGhost
          ? {
              fontSize: `${28 * zoom}px`,
            }
          : undefined
      }
      className={`flex items-center justify-center font-extrabold select-none transition-all duration-150 border-2
        ${!isPlaced && !isHoverGhost ? "aspect-square size-18 text-3xl cursor-pointer" : "w-full h-full"}
        ${
          isHoverGhost
            ? "rounded-lg font-mono border-dashed border-primary/50 bg-primary/10 text-tile-foreground/60 pointer-events-none"
            : state === "selected"
              ? "rounded-xl text-tile-foreground ring-4 ring-blue-400/50 -translate-y-2 bg-tile-primary border-tile-border shadow-[0_4px_0_0_var(--tile-shadow),0_6px_12px_rgba(0,0,0,0.15)]"
              : isPlaced && team === "b"
                ? "rounded-xl text-tile-foreground bg-tile-accent border-tile-border shadow-[0_4px_0_0_#cbd5e1,0_4px_6px_-1px_rgba(0,0,0,0.1)]"
                : "rounded-xl text-tile-foreground bg-tile-primary border-tile-border shadow-[0_4px_0_0_var(--tile-shadow),0_6px_12px_rgba(0,0,0,0.15)]"
        }
        ${!isPlaced && !isHoverGhost ? "hover:-translate-y-1 hover:shadow-[0_6px_0_0_var(--tile-shadow),0_8px_16px_rgba(0,0,0,0.2)]" : ""}
        ${state === "placeholder" ? "animate-wiggle" : ""}`}>
      <span className="leading-none tracking-tight" style={{ fontFamily: "var(--font-nunito), ui-sans-serif, system-ui" }}>
        {letter.toUpperCase()}
      </span>
    </motion.div>
  );
}
