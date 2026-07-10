"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

/** Cycles light → dark → system; persists to localStorage and sets data-theme. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const stored = (localStorage.getItem("theme") as Theme) || "system";
    setTheme(stored);
  }, []);

  function apply(next: Theme) {
    setTheme(next);
    localStorage.setItem("theme", next);
    const root = document.documentElement;
    if (next === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", next);
  }

  const icon = theme === "dark" ? "☾" : theme === "light" ? "☀" : "◐";
  const label = theme === "dark" ? "Dark" : theme === "light" ? "Light" : "Auto";

  return (
    <button
      type="button"
      onClick={() => apply(theme === "light" ? "dark" : theme === "dark" ? "system" : "light")}
      title={`Theme: ${label} (click to change)`}
      aria-label={`Theme: ${label}`}
      className="rounded-md border border-line bg-paper px-2.5 py-1.5 text-[13px] text-ink-soft hover:text-ink hover:bg-cream-50 cursor-pointer"
    >
      <span aria-hidden className="mr-1">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
