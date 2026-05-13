"use client";

import type React from "react";
import { cn } from "@/lib/utils";

/** Up to 2 initials from display name (e.g. "Jane Doe" → JD, "localhost" → LO). */
export function initialsFromName(name: string): string {
  const t = name.trim();
  if (!t) return "U";
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0][0] ?? "";
    const b = parts[parts.length - 1][0] ?? "";
    const s = (a + b).toUpperCase();
    return s || "U";
  }
  const word = parts[0] ?? t;
  const alnum = word.replace(/[^a-zA-Z0-9]/g, "");
  if (alnum.length >= 2) return alnum.slice(0, 2).toUpperCase();
  if (word.length >= 2) return word.slice(0, 2).toUpperCase();
  return (word[0] ?? "U").toUpperCase();
}

export type UserInitialsAvatarSize = "sm" | "md" | "lg";

const sizeClass: Record<UserInitialsAvatarSize, string> = {
  sm: "h-9 w-9 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-24 w-24 text-3xl",
};

export function UserInitialsAvatar({
  name,
  size,
  className,
  decorative = true,
}: {
  name: string;
  size: UserInitialsAvatarSize;
  className?: string;
  /** When true, hide from assistive tech (use when name is repeated nearby). */
  decorative?: boolean;
}) {
  const initials = initialsFromName(name);
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-amber-600 font-semibold text-white shadow-sm ring-2 ring-white/20",
        sizeClass[size],
        className
      )}
      {...(decorative ? { "aria-hidden": true as const } : { role: "img", "aria-label": name })}
    >
      {initials}
    </span>
  );
}
