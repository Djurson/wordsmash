"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

interface GameCodeDisplayProps {
  code: string;
}

export function GameCodeDisplay({ code }: GameCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [left, right] = code.split("-");

  return (
    <div className="p-6 border shadow-sm rounded-2xl bg-card border-border">
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-col items-center gap-1">
          <h2 className="text-lg font-extrabold text-foreground">Spelkod</h2>
          <p className="text-xs text-muted-foreground">Dela din kod för att bjuda in vänner</p>
        </div>
        <button
          onClick={handleCopy}
          className={
            "group flex items-center gap-3 rounded-xl px-6 py-4 transition-all bg-tile-secondary hover:bg-primary/40 border-2 border-border hover:border-primary/60 hover:shadow-[0_4px_0_0_var(--tile-shadow),0_6px_12px_rgba(0,0,0,0.15)] active:shadow-[0_1px_0_0_var(--tile-shadow),0_2px_4px_rgba(0,0,0,0.08)] active:translate-y-px"
          }>
          <div className="flex items-center gap-1">
            {left.split("").map((char, i) => (
              <LetterDisplay key={`l-${i}`} char={char} />
            ))}
          </div>
          <span className="text-2xl font-bold text-muted-foreground">-</span>
          <div className="flex items-center gap-1">
            {right.split("").map((char, i) => (
              <LetterDisplay key={`r-${i}`} char={char} />
            ))}
          </div>
          <div className="flex items-center justify-center ml-2 transition-colors rounded-lg w-9 h-9 bg-secondary text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </div>
        </button>
        {copied && <span className="absolute px-2 py-1 text-xs font-medium -translate-x-1/2 rounded-md -top-8 left-1/2 text-card bg-foreground">Kopierat!</span>}
      </div>
    </div>
  );
}

function LetterDisplay({ char }: { char: string }) {
  return (
    <span className="flex items-center justify-center text-3xl font-extrabold rounded-xl text-tile-foreground group-hover:bg-tile-primary border-tile-border border group-hover:shadow-[0_4px_0_0_var(--tile-shadow),0_6px_12px_rgba(0,0,0,0.15)] aspect-square size-12 duration-200 ease-in-out">
      {char}
    </span>
  );
}
