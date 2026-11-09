"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const noop = () => () => {};

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // The resolved theme is only known on the client; render a neutral label until mounted.
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  const isDark = mounted && resolvedTheme === "dark";
  const label = !mounted ? "Cambiar tema" : isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" onClick={() => setTheme(isDark ? "light" : "dark")} aria-label={label}>
          <Sun className="hidden dark:block" aria-hidden />
          <Moon className="dark:hidden" aria-hidden />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
