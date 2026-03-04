import { ZoomIn, ZoomOut } from "lucide-react";

interface ZoomControlProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  zoom: number;
}

export function ZoomControls({ onZoomIn, onZoomOut, zoom }: ZoomControlProps) {
  return (
    <div className="absolute z-30 flex flex-col p-1 border shadow-lg bottom-6 right-6 gap-1 bg-white/90 backdrop-blur-md rounded-xl border-slate-200">
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onZoomIn();
        }}
        className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-900">
        <ZoomIn className="w-5 h-5" />
      </button>
      <div className="text-[10px] text-center text-slate-400 font-mono py-1">{Math.round(zoom * 100)}%</div>
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onZoomOut();
        }}
        className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-900">
        <ZoomOut className="w-5 h-5" />
      </button>
    </div>
  );
}
