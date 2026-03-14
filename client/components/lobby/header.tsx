import GameTile from "@/components/game/game-tile";

export function MenuHeader() {
  return (
    <header className="relative z-10 flex items-center justify-center pt-6">
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
    </header>
  );
}
