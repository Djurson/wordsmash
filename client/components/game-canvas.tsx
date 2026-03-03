"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ZoomControls } from "./zoom-controls";
import { cn } from "@/lib/utils";
import { GhostPointer } from "./ghost-pointer";

export interface PlacedTile {
  letter: string;
  x: number;
  y: number;
  team: "a" | "b";
}

interface GameCanvasProps {
  tiles: PlacedTile[];
  selectedLetter: string | null;
  onPlaceTile: (x: number, y: number) => void;
}

const TILE_SIZE = 64;
const GAP = 4;
const CELL = TILE_SIZE + GAP;

export function GameCanvas({ tiles, selectedLetter, onPlaceTile }: GameCanvasProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);

  const panStartRef = useRef({ x: 0, y: 0 });
  const offsetStartRef = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-centrera brädet vid start
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setOffset({
        x: 0, // Börjar i mitten
        y: 0,
      });
    }
  }, []);

  const screenToGrid = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const worldX = (clientX - rect.left - cx - offset.x) / zoom;
      const worldY = (clientY - rect.top - cy - offset.y) / zoom;
      return {
        x: Math.round(worldX / CELL),
        y: Math.round(worldY / CELL),
      };
    },
    [offset, zoom],
  );

  // V0's PointerEvents för bäst mus/touch-stöd
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      setIsPanning(true);
      hasDragged.current = false;
      panStartRef.current = { x: e.clientX, y: e.clientY };
      offsetStartRef.current = { ...offset };
      containerRef.current?.setPointerCapture(e.pointerId);
    },
    [offset],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      // Uppdatera hover/spök-brickan
      if (selectedLetter) {
        const cell = screenToGrid(e.clientX, e.clientY);
        setHoverCell(cell);
      } else {
        setHoverCell(null);
      }

      if (!isPanning) return;

      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDragged.current = true;

      setOffset({
        x: offsetStartRef.current.x + dx,
        y: offsetStartRef.current.y + dy,
      });
    },
    [isPanning, selectedLetter, screenToGrid],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      setIsPanning(false);
      containerRef.current?.releasePointerCapture(e.pointerId);

      if (!hasDragged.current && selectedLetter) {
        const cell = screenToGrid(e.clientX, e.clientY);
        const occupied = tiles.some((t) => t.x === cell.x && t.y === cell.y);
        if (!occupied) {
          onPlaceTile(cell.x, cell.y);
        }
      }
    },
    [selectedLetter, screenToGrid, tiles, onPlaceTile],
  );

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setZoom((prev) => Math.max(0.3, Math.min(2.5, prev + delta)));
  }, []);

  const hoverOccupied = hoverCell ? tiles.some((t) => t.x === hoverCell.x && t.y === hoverCell.y) : false;

  return (
    <div
      ref={containerRef}
      className={cn("fixed inset-0 overflow-hidden touch-none", isPanning ? "cursor-grabbing" : selectedLetter ? "cursor-crosshair" : "cursor-grab")}
      style={{
        backgroundImage: "radial-gradient(circle, var(--canvas-dot, #cbd5e1) 1.5px, transparent 1.5px)",
        backgroundColor: "var(--background, #f8fafc)",
        backgroundSize: `${32 * zoom}px ${32 * zoom}px`,
        backgroundPosition: `calc(50% + ${offset.x}px) calc(50% + ${offset.y}px)`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}>
      {/* Draw the selected letter */}
      {selectedLetter && hoverCell && !hoverOccupied && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: TILE_SIZE * zoom,
            height: TILE_SIZE * zoom,
            transform: `translate(${offset.x + hoverCell.x * CELL * zoom - (TILE_SIZE * zoom) / 2}px, ${offset.y + hoverCell.y * CELL * zoom - (TILE_SIZE * zoom) / 2}px)`,
            zIndex: 15,
            fontSize: 28 * zoom,
          }}
          className="flex items-center justify-center rounded-lg font-mono font-bold select-none border-2 border-dashed border-primary/50 bg-primary/10 text-primary/60 pointer-events-none">
          {selectedLetter}
        </div>
      )}

      {/* Draw the placed letters */}
      <AnimatePresence>
        {tiles.map((tile) => {
          const px = offset.x + tile.x * CELL * zoom;
          const py = offset.y + tile.y * CELL * zoom;
          const halfTile = (TILE_SIZE * zoom) / 2;

          return (
            <div
              key={`${tile.letter}-${tile.team}-${tile.x}-${tile.y}`}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: TILE_SIZE * zoom,
                height: TILE_SIZE * zoom,
                transform: `translate(${px - halfTile}px, ${py - halfTile}px)`,
                zIndex: 10,
                fontSize: 28 * zoom,
              }}>
              <motion.div
                initial={{ scale: 0, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className={cn(
                  "w-full h-full flex items-center justify-center rounded-xl font-mono font-bold select-none border-2 shadow-[0_4px_0_0_#cbd5e1,0_4px_6px_-1px_rgba(0,0,0,0.1)] text-tile-foreground",
                  tile.team === "a" && "bg-tile-primary border-tile-border",
                  tile.team === "b" && "bg-tile-accent border-tile-border",
                )}>
                <span>{tile.letter}</span>
              </motion.div>
            </div>
          );
        })}
      </AnimatePresence>

      {/* <GhostPointer offset={offset} color="#ff0000" name="Kalle" zoom={zoom} cell={CELL} /> */}
      <ZoomControls zoom={zoom} onZoomIn={() => setZoom((prev) => Math.min(2.5, prev + 0.2))} onZoomOut={() => setZoom((prev) => Math.max(0.3, prev - 0.2))} />
    </div>
  );
}
