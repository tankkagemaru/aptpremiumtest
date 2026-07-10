const LEVELS = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"];

/** Simple print-safe CEFR bar chart: a bar per skill, height by CEFR level. */
export function CefrProfile({ rows }: { rows: { label: string; band: string }[] }) {
  return (
    <div>
      <div className="flex gap-2 items-end h-36 border-l border-b border-line pl-1 pb-0">
        {rows.map((r, i) => {
          const idx = Math.max(0, LEVELS.indexOf(r.band));
          const pct = ((idx + 1) / LEVELS.length) * 100;
          const isOverall = i === rows.length - 1;
          return (
            <div key={r.label} className="flex-1 flex flex-col items-center justify-end h-full">
              <span className="figures text-[11px] mb-0.5">{r.band}</span>
              <div
                className="w-full rounded-t-sm"
                style={{
                  height: `${pct}%`,
                  minHeight: 4,
                  background: isOverall ? "var(--gold)" : "var(--crimson)",
                  WebkitPrintColorAdjust: "exact",
                  printColorAdjust: "exact",
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 mt-1">
        {rows.map((r) => (
          <span key={r.label} className="flex-1 text-center text-[10px] text-ink-muted leading-tight">
            {r.label}
          </span>
        ))}
      </div>
      <p className="text-[10px] text-ink-muted mt-2">CEFR scale A0 → C2</p>
    </div>
  );
}
