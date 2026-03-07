"use client";

import { useState, useRef, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { ZoomControls } from "./zoom-controls";
import GameTile from "./game-tile";
import { PlacedTile } from "@/lib/game/types";
import { CELL, getTileKey, isValidPlacement, MAX_ZOOM_IN, MAX_ZOOM_OUT, TILE_SIZE } from "@/lib/game/utils";
import { useGameContext } from "@/hooks/gamecontext";

export function GameCanvas() {
  const { localGameState, gamestate, user, updateLocalGameState, sendMessage } = useGameContext();

  if (!gamestate || !user) return;

  const tiles = { ...gamestate.board, ...localGameState.currentTurnTiles };

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
      if (localGameState.selectedLetterId) {
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
    [isPanning, localGameState.selectedLetterId, screenToGrid],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      setIsPanning(false);
      containerRef.current?.releasePointerCapture(e.pointerId);

      if (!hasDragged.current && localGameState.selectedLetterId) {
        const cell = screenToGrid(e.clientX, e.clientY);
        handlePlaceTile(cell.x, cell.y);
      }
    },
    [localGameState.selectedLetterId, screenToGrid, tiles],
  );

  const handleWheel = useCallback((e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setZoom((prev) => Math.max(MAX_ZOOM_OUT, Math.min(MAX_ZOOM_IN, prev + delta)));
  }, []);

  const handlePlaceTile = useCallback(
    (x: number, y: number) => {
      if (localGameState.selectedLetterId === null) return;

      // Rule checking
      const validationResult = isValidPlacement(x, y, localGameState.currentTurnDirection, gamestate.board, localGameState.currentTurnTiles);
      if (validationResult === false) {
        return;
      }

      const targetKey = getTileKey(x, y);
      const letter = gamestate.teams[user.team].teamLetters[localGameState.selectedLetterId];
      const newTile: PlacedTile = { letter: letter.letter, x, y, team: "a", state: "placeholder", id: localGameState.selectedLetterId };

      sendMessage("lock_letter", { letterId: localGameState.selectedLetterId });
      updateLocalGameState({ currentTurnDirection: validationResult, selectedLetterId: null, currentTurnTiles: { [targetKey]: newTile } });
    },
    [localGameState.selectedLetterId, gamestate.teams[user.team].teamLetters, gamestate.board, localGameState.currentTurnTiles, localGameState.currentTurnDirection],
  );

  const hoverOccupied = hoverCell ? !!tiles[getTileKey(hoverCell.x, hoverCell.y)] : false;

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 overflow-hidden touch-none ${isPanning ? "cursor-grabbing" : localGameState.selectedLetterId ? "cursor-crosshair" : "cursor-grab"}`}
      style={{
        backgroundImage: "radial-gradient(circle, var(--canvas-dot, #cbd5e1) 1.5px, transparent 1.5px)",
        backgroundColor: "var(--background, --tile-secondary))",
        backgroundSize: `${CELL * zoom}px ${CELL * zoom}px`,
        backgroundPosition: `calc(50% + ${offset.x + (CELL * zoom) / 2}px) calc(50% + ${offset.y + (CELL * zoom) / 2}px)`,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onWheel={handleWheel}>
      {localGameState.selectedLetterId && hoverCell && !hoverOccupied && (
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
          <GameTile letter={gamestate.teams[user.team].teamLetters[localGameState.selectedLetterId].letter} state="selected-hover" zoom={zoom} />
        </div>
      )}

      {/* Draw the placed letters */}
      <AnimatePresence>
        {Object.values(tiles).map((tile) => {
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
              <GameTile letter={tile.letter} team={tile.team} state={tile.state} zoom={zoom} />
            </div>
          );
        })}
      </AnimatePresence>

      <ZoomControls zoom={zoom} onZoomIn={() => setZoom((prev) => Math.min(MAX_ZOOM_IN, prev + 0.2))} onZoomOut={() => setZoom((prev) => Math.max(MAX_ZOOM_OUT, prev - 0.2))} />
    </div>
  );
}
