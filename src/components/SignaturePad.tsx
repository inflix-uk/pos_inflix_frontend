"use client";

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Eraser } from "lucide-react";

export interface SignaturePadHandle {
 clear: () => void;
 isEmpty: () => boolean;
 /** PNG data URL of the signature (transparent background), or null when nothing is drawn. */
 toDataUrl: () => string | null;
}

interface SignaturePadProps {
 /** Called whenever the pad goes from empty → drawn or back. */
 onChange?: (hasInk: boolean) => void;
 height?: number;
 disabled?: boolean;
 className?: string;
}

/** Finger / mouse / pen signature box. No dependencies; works on phones and tills. */
const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(function SignaturePad(
 { onChange, height = 180, disabled = false, className = "" },
 ref
) {
 const canvasRef = useRef<HTMLCanvasElement | null>(null);
 const wrapRef = useRef<HTMLDivElement | null>(null);
 const drawing = useRef(false);
 const last = useRef<{ x: number; y: number } | null>(null);
 const inkRef = useRef(false);
 const [hasInk, setHasInk] = useState(false);

 const setInk = useCallback(
  (v: boolean) => {
   if (inkRef.current === v) return;
   inkRef.current = v;
   setHasInk(v);
   onChange?.(v);
  },
  [onChange]
 );

 // Size the canvas to its box at device pixel ratio so lines stay sharp.
 useEffect(() => {
  const canvas = canvasRef.current;
  const wrap = wrapRef.current;
  if (!canvas || !wrap) return;
  const resize = () => {
   const ratio = Math.max(1, window.devicePixelRatio || 1);
   const w = wrap.clientWidth;
   // Resizing clears the canvas, so only do it when the width really changed.
   if (canvas.width === Math.round(w * ratio) && canvas.height === Math.round(height * ratio)) return;
   canvas.width = Math.round(w * ratio);
   canvas.height = Math.round(height * ratio);
   canvas.style.width = `${w}px`;
   canvas.style.height = `${height}px`;
   const ctx = canvas.getContext("2d");
   if (ctx) {
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = "#111827";
   }
   setInk(false);
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(wrap);
  return () => ro.disconnect();
 }, [height, setInk]);

 const pointFrom = (e: React.PointerEvent<HTMLCanvasElement>) => {
  const rect = e.currentTarget.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
 };

 const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
  if (disabled) return;
  e.preventDefault();
  e.currentTarget.setPointerCapture(e.pointerId);
  drawing.current = true;
  const p = pointFrom(e);
  last.current = p;
  const ctx = canvasRef.current?.getContext("2d");
  if (ctx) {
   ctx.beginPath();
   ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
   ctx.fillStyle = "#111827";
   ctx.fill();
  }
  setInk(true);
 };

 const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
  if (!drawing.current || disabled) return;
  e.preventDefault();
  const ctx = canvasRef.current?.getContext("2d");
  const p = pointFrom(e);
  if (ctx && last.current) {
   ctx.beginPath();
   ctx.moveTo(last.current.x, last.current.y);
   ctx.lineTo(p.x, p.y);
   ctx.stroke();
  }
  last.current = p;
 };

 const endStroke = () => {
  drawing.current = false;
  last.current = null;
 };

 const clear = useCallback(() => {
  const canvas = canvasRef.current;
  const ctx = canvas?.getContext("2d");
  if (canvas && ctx) {
   ctx.save();
   ctx.setTransform(1, 0, 0, 1, 0, 0);
   ctx.clearRect(0, 0, canvas.width, canvas.height);
   ctx.restore();
  }
  setInk(false);
 }, [setInk]);

 useImperativeHandle(
  ref,
  () => ({
   clear,
   isEmpty: () => !inkRef.current,
   toDataUrl: () => (inkRef.current && canvasRef.current ? canvasRef.current.toDataURL("image/png") : null),
  }),
  [clear]
 );

 return (
  <div className={className}>
   <div
    ref={wrapRef}
    className={`relative w-full rounded-xl border-2 border-dashed ${
     disabled ? "border-gray-200 bg-gray-50" : "border-gray-300 bg-white"
    }`}
    style={{ height }}
   >
    <canvas
     ref={canvasRef}
     className="absolute inset-0 touch-none select-none rounded-xl"
     style={{ cursor: disabled ? "not-allowed" : "crosshair" }}
     onPointerDown={onPointerDown}
     onPointerMove={onPointerMove}
     onPointerUp={endStroke}
     onPointerCancel={endStroke}
     onPointerLeave={endStroke}
     aria-label="Signature area. Sign with your finger or mouse."
     role="img"
    />
    {!hasInk && (
     <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-gray-400">
      Sign here
     </span>
    )}
    <span className="pointer-events-none absolute bottom-7 left-6 right-6 border-b border-gray-300" />
   </div>
   <div className="mt-2 flex justify-end">
    <button
     type="button"
     onClick={clear}
     disabled={!hasInk || disabled}
     className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
    >
     <Eraser className="h-3.5 w-3.5" />
     Clear
    </button>
   </div>
  </div>
 );
});

export default SignaturePad;
