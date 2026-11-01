"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

const ThemeContext = createContext<{ theme: Theme; resolvedTheme: "light" | "dark"; toggleTheme: () => void } | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    const savedTheme = window.localStorage.getItem("paletbek-theme");
    return savedTheme === "light" || savedTheme === "dark" ? savedTheme : "system";
  });
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const savedTheme = window.localStorage.getItem("paletbek-theme");
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = (currentTheme: Theme) => {
      const resolved = currentTheme === "system" ? (media.matches ? "dark" : "light") : currentTheme;
      document.documentElement.classList.toggle("dark", resolved === "dark");
      document.documentElement.style.colorScheme = resolved;
      setResolvedTheme(resolved);
    };

    applyTheme(theme);

    const handleSystemThemeChange = () => {
      if (theme === "system") applyTheme("system");
    };
    media.addEventListener("change", handleSystemThemeChange);

    return () => media.removeEventListener("change", handleSystemThemeChange);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
    window.localStorage.setItem("paletbek-theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    document.documentElement.style.colorScheme = nextTheme;
    setTheme(nextTheme);
    setResolvedTheme(nextTheme);
  }, [resolvedTheme]);

  return <ThemeContext.Provider value={{ theme, resolvedTheme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
