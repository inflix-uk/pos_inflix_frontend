"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { CircleHelp } from "lucide-react";

export type HelpTipProps = {
  children: React.ReactNode;
  ariaLabel?: string;
  className?: string;
  contentClassName?: string;
  /** Popover horizontal alignment relative to the icon */
  align?: "start" | "end";
  iconClassName?: string;
};

export function HelpTip({
  children,
  ariaLabel = "More information",
  className = "",
  contentClassName = "",
  align = "start",
  iconClassName = "h-4 w-4",
}: HelpTipProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open, close]);

  const hPos = align === "end" ? "right-0 left-auto" : "left-0 right-auto";

  return (
    <div className={`relative inline-flex shrink-0 align-middle ${className}`.trim()} ref={rootRef}>
      <button
        type="button"
        className="inline-flex rounded-full p-0.5 text-slate-400 transition-colors hover:bg-orange-50 hover:text-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-1"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
      >
        <CircleHelp className={iconClassName} aria-hidden />
      </button>
      {open ? (
        <div
          id={panelId}
          role="tooltip"
          className={`absolute z-[100] top-full mt-1.5 ${hPos} min-w-[200px] max-w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white p-3 text-sm leading-relaxed text-slate-700 shadow-lg ring-1 ring-black/5 ${contentClassName}`.trim()}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
