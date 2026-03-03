"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHydrated } from "@/shared/lib/use-hydrated";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <Button variant="ghost" size="icon" aria-label="Alternar tema" disabled>
        <Sun className="size-5" />
      </Button>
    );
  }

  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Mudar para tema claro" : "Mudar para tema escuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </Button>
  );
}
