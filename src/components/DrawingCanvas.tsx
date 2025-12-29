'use client';

import { useRef, useEffect, useState } from 'react';
import { Eraser, Pen, MousePointer2 } from 'lucide-react';
import { clsx } from 'clsx';

interface DrawingCanvasProps {
  width: number;
  height: number;
  page: number;
}

export default function DrawingCanvas({ width, height, page }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser' | 'pointer'>('pointer');
  const [color, setColor] = useState('#ef4444'); // Red default
  const [lineWidth, setLineWidth] = useState(3);

  // Load saved drawing when page changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Load from local storage (simple key based on page)
    const saved = localStorage.getItem(`drawing-page-${page}`);
    if (saved) {
      const img = new Image();
      img.src = saved;
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
    }
  }, [page, width, height]);

  // Save to local storage on mouse up
  const saveDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    localStorage.setItem(`drawing-page-${page}`, dataUrl);
  };

  const startDrawing = (e: React.MouseEvent) => {
    if (tool === 'pointer') return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = tool === 'eraser' ? 20 : lineWidth;
    ctx.lineCap = 'round';
    ctx.strokeStyle = tool === 'eraser' ? 'rgba(0,0,0,0)' : color; // Eraser logic requires globalCompositeOperation

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    } else {
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || tool === 'pointer') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      saveDrawing();
    }
    setIsDrawing(false);
  };

  return (
    <div className="absolute inset-0 z-50 pointer-events-none">
      {/* Toolbar - Floating */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur border border-white/10 p-2 rounded-xl flex items-center gap-2 pointer-events-auto shadow-2xl">
        <button
          onClick={() => setTool('pointer')}
          className={clsx("p-2 rounded-lg transition-colors", tool === 'pointer' ? "bg-cyan-500 text-white" : "text-slate-400 hover:bg-white/10")}
        >
          <MousePointer2 className="w-5 h-5" />
        </button>
        <button
          onClick={() => setTool('pen')}
          className={clsx("p-2 rounded-lg transition-colors", tool === 'pen' ? "bg-cyan-500 text-white" : "text-slate-400 hover:bg-white/10")}
        >
          <Pen className="w-5 h-5" />
        </button>
        <button
          onClick={() => setTool('eraser')}
          className={clsx("p-2 rounded-lg transition-colors", tool === 'eraser' ? "bg-cyan-500 text-white" : "text-slate-400 hover:bg-white/10")}
        >
          <Eraser className="w-5 h-5" />
        </button>
        <div className="w-px h-6 bg-white/10 mx-1" />
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer bg-transparent border-none"
        />
        <input
          type="range"
          min="1"
          max="10"
          value={lineWidth}
          onChange={(e) => setLineWidth(parseInt(e.target.value))}
          className="w-20 accent-cyan-500"
        />
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className={clsx(
          "w-full h-full pointer-events-auto",
          tool === 'pointer' ? "cursor-default" : "cursor-crosshair"
        )}
      />
    </div>
  );
}
