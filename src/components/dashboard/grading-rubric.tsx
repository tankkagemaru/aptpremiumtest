/** Collapsible marking guide for the grading workspace: the 0–50 → CEFR band
 *  guide plus CEFR descriptors for the module being graded. */

const BANDS: { band: string; range: string }[] = [
  { band: "A0", range: "0–9" },
  { band: "A1", range: "10–17" },
  { band: "A2", range: "18–25" },
  { band: "B1", range: "26–33" },
  { band: "B2", range: "34–41" },
  { band: "C1", range: "42–45" },
  { band: "C2", range: "46–50" },
];

const WRITING: Record<string, string> = {
  A1: "Simple isolated phrases and sentences.",
  A2: "Series of simple phrases/sentences linked with 'and', 'but', 'because'.",
  B1: "Straightforward connected text on familiar subjects; linear sequence of ideas.",
  B2: "Clear, detailed text on varied subjects; controls register.",
  C: "Clear, smoothly flowing, well-structured complex text.",
};

const SPEAKING: Record<string, string> = {
  A1: "Simple descriptions on mainly personal topics.",
  A2: "Simple description of people/routines as a short list of phrases.",
  B1: "Reasonably fluent, straightforward description as a linear sequence of points.",
  B2: "Clear, systematically developed description; highlights significant points.",
  C: "Clear, smoothly flowing, well-structured speech with effective logical structure.",
};

const RUBRIC: Record<string, { title: string; dims: string[]; levels: Record<string, string> }> = {
  writing: {
    title: "Writing",
    dims: ["Task fulfilment & length", "Coherence / organisation", "Grammatical range & accuracy", "Vocabulary range & precision"],
    levels: WRITING,
  },
  speaking: {
    title: "Speaking",
    dims: ["Task fulfilment", "Fluency & coherence", "Grammar & accuracy", "Vocabulary", "Pronunciation"],
    levels: SPEAKING,
  },
};

export function GradingRubric({ module }: { module: "writing" | "speaking" }) {
  const r = RUBRIC[module];
  return (
    <details className="rounded-card border border-line bg-cream-50 px-4 py-3">
      <summary className="cursor-pointer text-[13px] font-medium select-none">
        Marking guide — {r.title} (0–50 → CEFR)
      </summary>
      <div className="mt-3 grid gap-4 sm:grid-cols-2 text-[13px]">
        <div>
          <p className="label-caps mb-1.5">Score → band</p>
          <div className="grid grid-cols-2 gap-x-4">
            {BANDS.map((b) => (
              <div key={b.band} className="flex justify-between border-b border-line py-0.5">
                <span>{b.band}</span>
                <span className="figures text-ink-muted">{b.range}</span>
              </div>
            ))}
          </div>
          <p className="text-[12px] text-ink-muted mt-2">
            Judge each dimension, then set an overall 0–50 score.
          </p>
        </div>
        <div>
          <p className="label-caps mb-1.5">Dimensions</p>
          <ul className="list-disc pl-4 space-y-0.5 mb-3">
            {r.dims.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
          <p className="label-caps mb-1.5">Level descriptors</p>
          <ul className="space-y-0.5">
            {Object.entries(r.levels).map(([lvl, txt]) => (
              <li key={lvl}>
                <span className="font-medium">{lvl}:</span> {txt}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </details>
  );
}
