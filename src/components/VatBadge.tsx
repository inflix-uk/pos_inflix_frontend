import React from "react";
import { cn } from "@/lib/utils";

/** Tax option chosen on the purchase (Settings → Tax), e.g. "Marginal VAT" or "Normal VAT". */
export function VatBadge({ name, className }: { name: string; className?: string }) {
  const marginal = /margin/i.test(name);
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center truncate rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none whitespace-nowrap ring-1",
        marginal ? "bg-amber-100 text-amber-900 ring-amber-300" : "bg-sky-100 text-sky-900 ring-sky-300",
        className
      )}
      title={`Tax: ${name}`}
    >
      {name}
    </span>
  );
}

/** Several tax options (e.g. a cart line mixing units bought under different schemes). */
export function VatBadges({ names, className }: { names: string[]; className?: string }) {
  if (names.length === 0) return null;
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1", className)}>
      {names.map((n) => (
        <VatBadge key={n} name={n} />
      ))}
    </span>
  );
}
