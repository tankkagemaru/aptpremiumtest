import { MODULE_LABEL, type ModuleScores } from "@/lib/scoring/cefr";

const MODULE_ORDER = ["core", "reading", "listening", "writing", "speaking"];

export function ScoreTable({ scores }: { scores: ModuleScores }) {
  const rows = MODULE_ORDER.filter((m) => scores[m]);
  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="border-b border-line">
          <th className="label-caps py-2 font-medium">Module</th>
          <th className="label-caps py-2 font-medium text-right">Scale (0–50)</th>
          <th className="label-caps py-2 font-medium text-right">CEFR</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((m) => (
          <tr key={m} className="border-b border-line">
            <td className="py-2.5 text-[15px]">{MODULE_LABEL[m] ?? m}</td>
            <td className="py-2.5 text-[15px] text-right figures">{scores[m].scale}</td>
            <td className="py-2.5 text-right">
              <span className="figures font-display text-lg">{scores[m].band}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
