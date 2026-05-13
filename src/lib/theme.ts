/**
 * App theme / brand color system.
 * Add new themes here and in globals.css [data-theme="..."] blocks.
 */
export type ThemeId = "blue" | "emerald" | "violet";

export const THEME_STORAGE_KEY = "app-theme";

export const DEFAULT_THEME: ThemeId = "blue";

export const THEMES: { id: ThemeId; name: string; primary: string }[] = [
  { id: "blue", name: "Blue", primary: "#0052cc" },
  { id: "emerald", name: "Emerald", primary: "#047857" },
  { id: "violet", name: "Violet", primary: "#6d28d9" },
];

export function isValidThemeId(value: string): value is ThemeId {
  return value === "blue" || value === "emerald" || value === "violet";
}

export function getStoredTheme(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored && isValidThemeId(stored) ? stored : DEFAULT_THEME;
}
