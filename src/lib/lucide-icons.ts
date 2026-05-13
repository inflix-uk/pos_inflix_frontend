import * as LucideIcons from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface IconEntry {
  name: string;
  Icon: LucideIcon;
}

/** All Lucide icon names and components (same set as /settings/icons). Use for pickers and rendering by name. */
export const LUCIDE_ICON_LIST: IconEntry[] = (() => {
  return Object.entries(LucideIcons)
    .filter(([name, component]) => {
      if (name.startsWith("Lucide")) return false;
      if (name === "icons" || name === "default" || name === "createLucideIcon") return false;
      if (typeof component !== "object" && typeof component !== "function") return false;
      if (!/^[A-Z]/.test(name)) return false;
      return true;
    })
    .map(([name, component]) => ({
      name,
      Icon: component as LucideIcon,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
})();

const iconByName = new Map<string, LucideIcon>(
  LUCIDE_ICON_LIST.map((e) => [e.name, e.Icon])
);

/** Get Lucide component by name (e.g. "Package", "Smartphone"). Returns undefined if not found. */
export function getLucideIconByName(name: string | undefined | null): LucideIcon | undefined {
  if (!name || typeof name !== "string") return undefined;
  return iconByName.get(name.trim());
}
