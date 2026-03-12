import { CELL } from "@/lib/game/utils";

const TILES = ["W", "O", "R", "D", "S", "M", "A", "S", "H"];

export function LoadingIcon() {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center min-h-screen overflow-hidden touch-none"
      style={{
        backgroundImage: "radial-gradient(circle, var(--canvas-dot, #cbd5e1) 1.5px, transparent 1.5px)",
        backgroundColor: "var(--background, var(--tile-secondary))",
        backgroundSize: `${CELL}px ${CELL}px`,
        backgroundPosition: `calc(50% + ${CELL / 2}px) calc(50% + ${CELL / 2}px)`,
      }}>
      <div className="flex gap-3">
        {TILES.map((letter, i) => (
          <div
            key={i}
            className={`flex items-center justify-center font-extrabold select-none transition-all duration-150 border-2 size-16 animate-bounce ${i < 4 ? "rounded-xl text-tile-foreground bg-tile-primary border-tile-border shadow-[0_4px_0_0_var(--tile-shadow),0_6px_12px_rgba(0,0,0,0.15)]" : "rounded-xl text-tile-foreground bg-tile-secondary border-tile-border shadow-[0_4px_0_0_var(--tile-shadow),0_6px_12px_rgba(0,0,0,0.15)]"}`}
            style={{
              animationDelay: `${i * 0.1}s`,
            }}>
            <span className="text-3xl font-bold select-none text-tile-foreground">{letter}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
