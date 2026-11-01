"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  const Icon = mounted ? (resolvedTheme === "dark" ? Moon : Sun) : Monitor;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={className}
      onClick={toggleTheme}
      aria-label={mounted ? `Включить ${resolvedTheme === "dark" ? "светлую" : "тёмную"} тему` : "Переключить тему"}
      title={mounted ? `Сейчас ${resolvedTheme === "dark" ? "тёмная" : "светлая"} тема` : "Переключить тему"}
    >
      <Icon className="size-4" aria-hidden="true" />
    </Button>
  );
}
