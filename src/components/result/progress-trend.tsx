import { Card } from "@/components/ui/card";

type Point = { scale: number; band: string; date: string };

/** Mini bar chart of overall scale (0–50) across a student's released results. */
export function ProgressTrend({ points }: { points: Point[] }) {
  if (points.length < 2) return null;
  const first = points[0].scale;
  const last = points[points.length - 1].scale;
  const delta = Math.round((last - first) * 10) / 10;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl">Your progress</h2>
        <span
          className={`text-[13px] figures rounded px-2 py-0.5 ${
            delta > 0 ? "bg-good-bg text-good" : delta < 0 ? "bg-alert-bg text-alert" : "bg-cream-50 text-ink-muted border border-line"
          }`}
        >
          {delta > 0 ? "▲" : delta < 0 ? "▼" : "—"} {Math.abs(delta)} since first
        </span>
      </div>
      <Card className="p-6">
        <div className="flex gap-3 items-end h-40 border-l border-b border-line pl-2">
          {points.map((p, i) => {
            const pct = Math.max(4, (p.scale / 50) * 100);
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                <span className="figures text-[12px] mb-1">{p.band}</span>
                <div
                  className="w-full rounded-t-md bg-crimson"
                  style={{ height: `${pct}%` }}
                  title={`${p.scale}/50`}
                />
              </div>
            );
          })}
        </div>
        <div className="flex gap-3 mt-2">
          {points.map((p, i) => (
            <span key={i} className="flex-1 text-center figures text-[11px] text-ink-muted">
              {new Date(p.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
            </span>
          ))}
        </div>
        <p className="text-[11px] text-ink-muted mt-2">Overall scale score (0–50) over time</p>
      </Card>
    </section>
  );
}
