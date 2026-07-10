"use client";

import { useEffect, useState } from "react";

const LEVELS = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"];

/** Animated CEFR bar chart for the student result — bars grow on mount. */
export function AnimatedCefrProfile({ rows }: { rows: { label: string; band: string }[] }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShown(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div>
      <div className="flex gap-3 items-end h-48 border-l border-b border-line pl-2">
        {rows.map((r, i) => {
          const idx = Math.max(0, LEVELS.indexOf(r.band));
          const pct = ((idx + 1) / LEVELS.length) * 100;
          const isOverall = i === rows.length - 1;
          return (
            <div key={r.label + i} className="flex-1 flex flex-col items-center justify-end h-full">
              <span
                className="figures text-[13px] mb-1 font-display"
                style={{ opacity: shown ? 1 : 0, transition: "opacity 500ms ease 700ms" }}
              >
                {r.band}
              </span>
              <div
                className="w-full rounded-t-md"
                style={{
                  height: shown ? `${pct}%` : "0%",
                  minHeight: shown ? 6 : 0,
                  transition: `height 900ms cubic-bezier(0.16,1,0.3,1) ${i * 90}ms`,
                  background: isOverall ? "var(--gold)" : "var(--crimson)",
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-3 mt-2">
        {rows.map((r, i) => (
          <span key={r.label + i} className="flex-1 text-center text-[11px] text-ink-muted leading-tight">
            {r.label}
          </span>
        ))}
      </div>
      <p className="text-[11px] text-ink-muted mt-2 text-center">CEFR scale A0 → C2</p>
    </div>
  );
}
