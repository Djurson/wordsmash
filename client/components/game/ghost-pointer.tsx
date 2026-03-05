import { MousePointer2 } from "lucide-react";

interface GhostPointer {
  offset: {
    x: number;
    y: number;
  };
  name: string;
  color: string;
  zoom: number;
  cell: number;
}

export function GhostPointer({ offset, name, zoom, cell }: GhostPointer) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: "50%",
        top: "50%",
        transform: `translate(${offset.x + 3 * cell * zoom}px, ${offset.y - 1 * cell * zoom}px)`,
        zIndex: 20,
      }}>
      <div className="flex items-center gap-1 drop-shadow-md">
        <MousePointer2 className="w-4 h-4 text-red-500 fill-red-500" />
        <span className="text-[10px] text-white font-medium bg-red-500 px-1.5 py-0.5 rounded shadow">{name}</span>
      </div>
    </div>
  );
}
