"use client";

import { useState, useRef, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { ZoomControls } from "./zoom-controls";
import GameTile from "./game-tile";
import { CELL, GAP, getTileKey, MAX_ZOOM_IN, MAX_ZOOM_OUT, TILE_SIZE, ZOOM_STEP } from "@/lib/game/utils";
import { useGameContext } from "@/hooks/gamecontext";
import { Bomb } from "lucide-react";

export function GameCanvas() {
  const { localGameState, gamestate, user, handlePlaceTile, handleSpecialAbilityPlacement, explosions } = useGameContext();

  const tiles = { ...(gamestate?.board ?? {}), ...(gamestate?.team.placeholders ?? {}), ...localGameState.currentTurnTiles };

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
      if (localGameState.selectedLetterId || localGameState.selectedPowerup) {
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
    [isPanning, localGameState.selectedLetterId, localGameState.selectedPowerup, screenToGrid],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      setIsPanning(false);
      containerRef.current?.releasePointerCapture(e.pointerId);

      if (!hasDragged.current) {
        const cell = screenToGrid(e.clientX, e.clientY);

        if (localGameState.selectedLetterId) handlePlaceTile(cell.x, cell.y);
        else if (localGameState.selectedPowerup === "bomb") handleSpecialAbilityPlacement("bomb", cell.x, cell.y);
        else if (localGameState.selectedPowerup === "roadblock") handleSpecialAbilityPlacement("roadblock", cell.x, cell.y);
      }
    },
    [localGameState.selectedLetterId, screenToGrid, handlePlaceTile, handleSpecialAbilityPlacement],
  );

  const handleWheel = useCallback((e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    setZoom((prev) => Math.max(MAX_ZOOM_OUT, Math.min(MAX_ZOOM_IN, prev + delta)));
  }, []);

  const hoverKey = hoverCell ? getTileKey(hoverCell.x, hoverCell.y) : null;
  const hoverOccupied = hoverKey ? !!tiles[hoverKey] : false;
  const hoverBlocked = hoverKey ? !!gamestate?.roadblocks && !!gamestate.roadblocks[hoverKey] : false;
  const isHoldingTool = localGameState.selectedLetterId || localGameState.selectedPowerup;

  if (!gamestate || !user) return;

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 overflow-hidden touch-none ${isPanning ? "cursor-grabbing" : isHoldingTool ? "cursor-crosshair" : "cursor-grab"}`}
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
      <div className="absolute" style={{ left: "50%", top: "50%", transformOrigin: "0 0", transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}>
        {/* GHOST PREVIEWS */}
        {hoverCell && (
          <div
            style={{ position: "absolute", left: hoverCell.x * CELL, top: hoverCell.y * CELL, width: TILE_SIZE, height: TILE_SIZE, transform: `translate(-50%, -50%)`, zIndex: 15 }}
            className="pointer-events-none">
            {/* Preview Letter Tile */}
            {localGameState.selectedLetterId && !hoverOccupied && !hoverBlocked && (
              <GameTile letter={gamestate.team.teamLetters[localGameState.selectedLetterId].letter} state="selected-hover" score={gamestate.team.teamLetters[localGameState.selectedLetterId].score} />
            )}

            {/* Preview Roadblock */}
            {localGameState.selectedPowerup === "roadblock" && !hoverOccupied && !hoverBlocked && <GameTile state="roadblock-hover" />}

            {/* Preview Bomb */}
            {localGameState.selectedPowerup === "bomb" && hoverOccupied && <GameTile state="bomb-hover" />}
          </div>
        )}

        {/* Draw all roadblocks */}
        {/** //TODO: Implement visuals for roadblocks */}
        <AnimatePresence>
          {Object.values(gamestate.roadblocks).map((rb) => {
            const timeLeft = rb.expiresAt - Date.now();
            const isDisappearing = timeLeft < 500;
            console.log(isDisappearing);

            return (
              <div
                key={`rb-${rb.x}-${rb.y}`}
                className={`absolute rounded-lg flex items-center justify-center ${isDisappearing ? "animate-roadblock-disappear" : "animate-roadblock-appear animate-roadblock-pulse"}`}
                style={{ left: rb.x * CELL, top: rb.y * CELL, width: TILE_SIZE, height: TILE_SIZE, transform: `translate(-50%, -50%)`, zIndex: 9 }}>
                <GameTile state="roadblock" expiresAt={rb.expiresAt} />
              </div>
            );
          })}
        </AnimatePresence>

        {Object.keys(explosions).map((key) => {
          const exp = explosions[key];
          return (
            <div
              key={exp.id}
              className="absolute z-50 pointer-events-none"
              style={{ position: "absolute", left: exp.x * CELL, top: exp.y * CELL, width: TILE_SIZE, height: TILE_SIZE, transform: `translate(-50%, -50%)`, zIndex: 20 }}>
              {/* Detonate the bomb */}
              <div className="relative flex items-center justify-center animate-bomb-explode">
                <div className="flex items-center justify-center w-full h-full rounded-lg shadow-2xl bg-bomb-red" style={{ width: TILE_SIZE, height: TILE_SIZE }}>
                  <Bomb className="text-white size-7 aspect-square" />
                </div>
              </div>

              {/* Ring explosion */}
              <div
                className="absolute inset-0 border-4 rounded-full border-bomb-red animate-explosion-ring"
                style={{
                  // left: "50%",
                  // top: "50%",
                  // transform: "translate(-50%, -50%)",
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                }}
              />
            </div>
          );
        })}

        {/* Draw the placed letters */}
        <AnimatePresence>
          {Object.values(tiles).map((tile) => {
            const bomb = gamestate.bombs[getTileKey(tile.x, tile.y)];
            return (
              <div
                key={`${tile.letter}-${tile.state}-${tile.x}-${tile.y}`}
                style={{ position: "absolute", left: tile.x * CELL, top: tile.y * CELL, width: TILE_SIZE, height: TILE_SIZE, transform: `translate(-50%, -50%)`, zIndex: 10 }}>
                {bomb && (
                  <div style={{ position: "absolute", width: TILE_SIZE, height: TILE_SIZE, zIndex: 40 }} className="pointer-events-none">
                    <GameTile state="bomb-placed" />
                  </div>
                )}
                <GameTile letter={tile.letter} state={tile.state} score={tile.score} />
              </div>
            );
          })}
        </AnimatePresence>
      </div>

      <ZoomControls zoom={zoom} onZoomIn={() => setZoom((prev) => Math.min(MAX_ZOOM_IN, prev + ZOOM_STEP))} onZoomOut={() => setZoom((prev) => Math.max(MAX_ZOOM_OUT, prev - ZOOM_STEP))} />
    </div>
  );
}
