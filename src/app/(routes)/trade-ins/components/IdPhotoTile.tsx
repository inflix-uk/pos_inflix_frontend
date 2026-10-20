"use client";

import React, { useRef } from "react";
import { ImagePlus, Loader2, Smartphone, Trash2 } from "lucide-react";

interface IdPhotoTileProps {
 label: string;
 dataUrl: string | null;
 uploadedVia?: "desktop" | "phone";
 busy?: boolean;
 onPick: (file: File) => void;
 onRemove: () => void;
}

/** One ID photo slot (front or back): preview + upload from this computer + remove. */
export function IdPhotoTile({ label, dataUrl, uploadedVia, busy, onPick, onRemove }: IdPhotoTileProps) {
 const inputRef = useRef<HTMLInputElement | null>(null);
 return (
  <div className="rounded-xl border border-gray-200 bg-white p-3">
   <div className="mb-2 flex items-center justify-between">
    <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">{label}</span>
    {uploadedVia === "phone" && dataUrl && (
     <span className="inline-flex items-center gap-1 rounded-full bg-lime-50 px-2 py-0.5 text-[11px] font-medium text-lime-800">
      <Smartphone className="h-3 w-3" /> from phone
     </span>
    )}
   </div>
   <button
    type="button"
    onClick={() => inputRef.current?.click()}
    disabled={busy}
    className="relative flex aspect-[3/2] w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 disabled:cursor-wait"
    aria-label={dataUrl ? `Replace ${label}` : `Upload ${label}`}
   >
    {dataUrl ? (
     // eslint-disable-next-line @next/next/no-img-element
     <img src={dataUrl} alt={label} className="h-full w-full object-contain" />
    ) : (
     <span className="flex flex-col items-center gap-1 text-xs text-gray-500">
      <ImagePlus className="h-6 w-6 text-gray-400" />
      Upload photo
     </span>
    )}
    {busy && (
     <span className="absolute inset-0 flex items-center justify-center bg-white/70">
      <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
     </span>
    )}
   </button>
   <input
    ref={inputRef}
    type="file"
    accept="image/*"
    capture="environment"
    className="hidden"
    onChange={(e) => {
     const f = e.target.files?.[0];
     e.target.value = "";
     if (f) onPick(f);
    }}
   />
   {dataUrl && (
    <button
     type="button"
     onClick={onRemove}
     disabled={busy}
     className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
    >
     <Trash2 className="h-3.5 w-3.5" /> Remove
    </button>
   )}
  </div>
 );
}
