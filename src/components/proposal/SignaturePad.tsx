"use client";

import { useEffect, useRef, useState } from "react";

/** Finger/stylus signature on a phone or tablet. Emits a PNG data URL (or null when cleared). */
export function SignaturePad({
  onChange,
  height = 160,
}: {
  onChange: (dataUrl: string | null) => void;
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const inked = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(false);

  function setup() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(dpr, dpr);
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#15181c";
    }
  }

  useEffect(() => {
    setup();
    const onResize = () => {
      setup();
      inked.current = false;
      setHasInk(false);
      onChange(null);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function pos(e: React.PointerEvent) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }
  function down(e: React.PointerEvent) {
    drawing.current = true;
    last.current = pos(e);
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }
  function move(e: React.PointerEvent) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !last.current) return;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    if (!inked.current) {
      inked.current = true;
      setHasInk(true);
    }
  }
  function up() {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    const canvas = canvasRef.current;
    if (canvas && inked.current) onChange(canvas.toDataURL("image/png"));
  }
  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    inked.current = false;
    setHasInk(false);
    onChange(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="spec">Sign with your finger</span>
        <button type="button" className="spec hover:underline" onClick={clear}>
          Clear
        </button>
      </div>
      <div className="relative mt-1 rounded-lg border border-[var(--line)] bg-white">
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height, touchAction: "none" }}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
        />
        {!hasInk && (
          <span className="spec pointer-events-none absolute inset-0 flex items-center justify-center text-[var(--muted)]">
            Sign here
          </span>
        )}
      </div>
    </div>
  );
}
