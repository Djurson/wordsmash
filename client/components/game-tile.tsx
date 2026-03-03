import { motion } from "framer-motion";

interface LetterTileProps {
  letter: string;
  team?: "a" | "b";
  state?: "idle" | "placed" | "selected";
  zoom?: number;
  onClick?: () => void;
}

export default function GameTile({ letter, team, state = "idle", onClick }: LetterTileProps) {
  const isActive = state === "idle" || state === "selected";

  return (
    <motion.div
      initial={isActive ? { scale: 0.8, opacity: 0 } : { scale: 0, opacity: 0, y: 10 }}
      animate={isActive ? { scale: 1, opacity: 1 } : { scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0, opacity: 0 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      onClick={onClick}
      className={`flex items-center justify-center rounded-lg font-extrabold cursor-pointer select-none transition-all duration-150 border-2 aspect-square size-18 text-3xl 
        ${state === "selected" ? "ring-4 ring-blue-400/50 -translate-y-2" : state === "placed" && team === "a" ? "bg-tile-primary border-tile-border" : "bg-tile-primary border-tile-border text-tile-foreground shadow-[0_4px_0_0_var(--tile-shadow),0_6px_12px_rgba(0,0,0,0.15)] hover:-translate-y-1 hover:shadow-[0_6px_0_0_var(--tile-shadow),0_8px_16px_rgba(0,0,0,0.2)]"}
        `}>
      <span className="leading-none tracking-tight" style={{ fontFamily: "var(--font-nunito), ui-sans-serif, system-ui" }}>
        {letter.toUpperCase()}
      </span>
    </motion.div>
  );
}
