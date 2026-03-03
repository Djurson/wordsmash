import { ZoomIn, ZoomOut } from "lucide-react";

interface ZoomControlProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  zoom: number;
}

export function ZoomControls({ onZoomIn, onZoomOut, zoom }: ZoomControlProps) {
  return (
    <div className="absolute bottom-6 right-6 flex flex-col gap-1 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 p-1 z-30">
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onZoomIn();
        }}
        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-900">
        <ZoomIn className="w-5 h-5" />
      </button>
      <div className="text-[10px] text-center text-slate-400 font-mono py-1">{Math.round(zoom * 100)}%</div>
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onZoomOut();
        }}
        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-900">
        <ZoomOut className="w-5 h-5" />
      </button>
    </div>
  );
}
