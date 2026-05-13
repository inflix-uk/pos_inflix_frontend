"use client";

import React from "react";

/** Inline spinner for buttons, table cells, dropdowns */
export function Loader({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-gray-200 border-t-orange-500 ${className}`}
      aria-hidden
    />
  );
}

/** Full-area loader for tables or sections (replaces plain "Loading…" text) */
export function TableLoader({ colSpan = 1 }: { colSpan?: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-16 text-center">
        <div className="flex items-center justify-center gap-2">
          <Loader className="h-8 w-8" />
          <span className="text-sm text-gray-500">Loading…</span>
        </div>
      </td>
    </tr>
  );
}

/** Centered block loader for cards/sections */
export function BlockLoader() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader className="h-10 w-10" />
    </div>
  );
}
