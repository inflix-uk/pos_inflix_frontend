"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  type ThemeId,
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  getStoredTheme,
  isValidThemeId,
} from "@/lib/theme";

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(DEFAULT_THEME);

  useEffect(() => {
    const stored = getStoredTheme();
    setThemeState(stored);
    if (stored === "blue") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", stored);
    }
  }, []);

  const setTheme = (next: ThemeId) => {
    if (!isValidThemeId(next)) return;
    setThemeState(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
    if (next === "blue") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", next);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: DEFAULT_THEME,
      setTheme: () => {},
    };
  }
  return ctx;
}
