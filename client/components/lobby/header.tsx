import GameTile from "@/components/game-tile";
import { motion } from "framer-motion";

export function MenuHeader() {
  return (
    <header className="relative z-10 flex items-center justify-center pt-6">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-8">
          <div className="flex gap-1.5">
            {["W", "O", "R", "D"].map((letter, i) => (
              <GameTile letter={letter} key={`s-${i}`} delay={i * 0.035} />
            ))}
          </div>
          <div className="flex gap-1.5">
            {["S", "M", "A", "S", "H"].map((letter, i) => (
              <GameTile state="secondary" letter={letter} key={`s-${i}`} delay={0.14 + 0.035 * i} />
            ))}
          </div>
        </div>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 800, damping: 20, delay: 0.5 }}
          className="z-30 px-4 py-2 font-medium border rounded-full shadow-sm bg-white/90 backdrop-blur-md border-slate-200 text-slate-500">
          <p className="text-sm font-medium text-muted-foreground">Bananagrams fast tillsammans med vänner!</p>
        </motion.div>
      </div>
    </header>
  );
}
