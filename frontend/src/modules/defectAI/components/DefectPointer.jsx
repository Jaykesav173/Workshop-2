import React, { useState } from 'react';
import { X, Maximize2 } from 'lucide-react';

const DefectPointer = ({ imageUrl, box }) => {
  const [isZoomed, setIsZoomed] = useState(false);
  
  // 1. Basic Validation
  const hasDefect = box && Array.isArray(box) && box.length === 4;

  if (!hasDefect) {
    return (
      <div className="relative w-full h-full bg-slate-100">
        <img src={imageUrl} className="w-full h-full object-cover" alt="vessel" />
      </div>
    );
  }

  // 2. Coordinate Calculations (Normalized to 1000x1000 for SVG viewBox)
  const [ymin, xmin, ymax, xmax] = box;
  const centerX = xmin + (xmax - xmin) / 2;
  const centerY = ymin + (ymax - ymin) / 2;

  // Offset the start of the arrow so it points AT the center from a distance
  const arrowStartX = centerX > 500 ? centerX + 150 : centerX - 150;
  const arrowStartY = centerY > 500 ? centerY + 150 : centerY - 150;

  const toggleZoom = () => setIsZoomed(!isZoomed);

  // 3. The Reusable Arrow/Label SVG
  const DrawingOverlay = ({ isModal }) => (
    <svg 
      viewBox="0 0 1000 1000" 
      className={`absolute inset-0 w-full h-full pointer-events-none ${isModal ? 'z-50' : ''}`}
    >
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
        </marker>
      </defs>

      {/* The Arrow Path */}
      <path
        d={`M ${arrowStartX} ${arrowStartY} L ${centerX} ${centerY}`}
        stroke="#ef4444"
        strokeWidth={isModal ? "8" : "12"}
        strokeLinecap="round"
        fill="none"
        markerEnd="url(#arrowhead)"
      />

      {/* Callout Label Box */}
      <g>
        <rect 
          x={arrowStartX - 70} 
          y={arrowStartY - 25} 
          width="140" 
          height="50" 
          rx="8" 
          fill="#ef4444" 
        />
        <text 
          x={arrowStartX} 
          y={arrowStartY + 8} 
          fill="white" 
          fontSize="24" 
          fontWeight="black" 
          textAnchor="middle"
          className="italic"
        >
          DEFECT
        </text>
      </g>

      {/* Target circle at the tip */}
      <circle cx={centerX} cy={centerY} r="15" fill="none" stroke="#ef4444" strokeWidth="4" />
      <circle cx={centerX} cy={centerY} r="5" fill="#ef4444" />
    </svg>
  );

  return (
    <>
      {/* THUMBNAIL VIEW */}
      <div 
        className="relative w-full h-full cursor-zoom-in group overflow-hidden bg-slate-900"
        onClick={toggleZoom}
      >
        <img 
          src={imageUrl} 
          className="w-full h-full object-cover opacity-90 transition-transform group-hover:scale-105" 
          alt="Inspection" 
        />
        <DrawingOverlay isModal={false} />
        <div className="absolute bottom-2 right-2 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          <Maximize2 size={14} />
        </div>
      </div>

      {/* FULLSCREEN MODAL */}
      {isZoomed && (
        <div 
          className="fixed inset-0 z-[999] bg-slate-950/90 flex items-center justify-center p-4"
          onClick={toggleZoom}
        >
          <button className="absolute top-6 right-6 text-white p-2 hover:bg-white/10 rounded-full">
            <X size={32} />
          </button>
          <div 
            className="relative max-w-5xl w-full rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img src={imageUrl} className="w-full h-auto" alt="Zoomed" />
            <DrawingOverlay isModal={true} />
          </div>
        </div>
      )}
    </>
  );
};

export default DefectPointer;