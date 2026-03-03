"use client";

import { useState, useRef, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { ZoomControls } from "./zoom-controls";
import { CELL, cn, MAX_ZOOM_IN, MAX_ZOOM_OUT, TILE_SIZE } from "@/lib/utils";
import GameTile from "./game-tile";

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

export function GameCanvas({ tiles, selectedLetter, onPlaceTile }: GameCanvasProps) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);

  const panStartRef = useRef({ x: 0, y: 0 });
  const offsetStartRef = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

      setOffset({ x: offsetStartRef.current.x + dx, y: offsetStartRef.current.y + dy });
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
    setZoom((prev) => Math.max(MAX_ZOOM_OUT, Math.min(MAX_ZOOM_IN, prev + delta)));
  }, []);

  const hoverOccupied = hoverCell ? tiles.some((t) => t.x === hoverCell.x && t.y === hoverCell.y) : false;

  return (
    <div
      ref={containerRef}
      className={cn("fixed inset-0 overflow-hidden touch-none", isPanning ? "cursor-grabbing" : selectedLetter ? "cursor-crosshair" : "cursor-grab")}
      style={{
        backgroundImage: "radial-gradient(circle, var(--canvas-dot, #cbd5e1) 1.5px, transparent 1.5px)",
        backgroundColor: "var(--background, #f8fafc)",
        backgroundSize: `${CELL * zoom}px ${CELL * zoom}px`,
        backgroundPosition: `calc(50% + ${offset.x + (CELL * zoom) / 2}px) calc(50% + ${offset.y + (CELL * zoom) / 2}px)`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}>
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
          }}
          className="pointer-events-none">
          <GameTile letter={selectedLetter} state="selected-hover" zoom={zoom} />
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
              }}>
              <GameTile letter={tile.letter} team={tile.team} state="placed" zoom={zoom} />
            </div>
          );
        })}
      </AnimatePresence>

      <ZoomControls zoom={zoom} onZoomIn={() => setZoom((prev) => Math.min(MAX_ZOOM_IN, prev + 0.2))} onZoomOut={() => setZoom((prev) => Math.max(MAX_ZOOM_OUT, prev - 0.2))} />
    </div>
  );
}
