/**
 * AI analysis of a student's mock-test result (strengths / weaknesses /
 * recommendations) and, when a previous attempt exists, progress between them.
 * Uses the OpenAI chat API. Degrades to null if no key is configured.
 */

export type ResultSnapshot = {
  overall_band: string | null;
  module_scores: Record<string, { scale: number; band: string }>;
};

export type ResultAnalysis = {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  progress: { summary: string; improved: string[]; declined: string[] } | null;
  model: string;
  generated_at: string;
};

export function isAnalysisConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

const MODULE_LABEL: Record<string, string> = {
  core: "Grammar & Vocabulary",
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
  speaking: "Speaking",
};

function describe(s: ResultSnapshot): string {
  const rows = Object.entries(s.module_scores)
    .map(([m, v]) => `${MODULE_LABEL[m] ?? m}: ${v.scale}/50 (${v.band})`)
    .join("; ");
  return `Overall CEFR ${s.overall_band ?? "—"}. Per skill — ${rows}.`;
}

export async function analyzeResult(
  current: ResultSnapshot,
  previous: ResultSnapshot | null,
  isoNow: string
): Promise<ResultAnalysis | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.OPENAI_MODEL || "gpt-4o";

  const system = `You are a warm, encouraging English tutor analysing an APTIS General mock-test result.
Be specific and reference the actual skills and CEFR levels. Keep each bullet to one short sentence.
Return ONLY JSON:
{"summary":"1-2 sentences","strengths":["..."],"weaknesses":["..."],"recommendations":["actionable study tips"],
 "progress":{"summary":"...","improved":["..."],"declined":["..."]}}
Set "progress" to null if no previous result is provided.`;

  const user = previous
    ? `CURRENT RESULT: ${describe(current)}\n\nPREVIOUS RESULT: ${describe(previous)}\n\nAnalyse the current result and compare with the previous one.`
    : `RESULT: ${describe(current)}\n\nAnalyse this result. No previous result exists, so set progress to null.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) {
      console.error("analysis failed", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    const p = JSON.parse(data.choices[0].message.content);
    const arr = (x: unknown): string[] => (Array.isArray(x) ? x.map(String) : []);
    return {
      summary: String(p.summary ?? ""),
      strengths: arr(p.strengths),
      weaknesses: arr(p.weaknesses),
      recommendations: arr(p.recommendations),
      progress: p.progress
        ? {
            summary: String(p.progress.summary ?? ""),
            improved: arr(p.progress.improved),
            declined: arr(p.progress.declined),
          }
        : null,
      model,
      generated_at: isoNow,
    };
  } catch (e) {
    console.error("analysis error", e);
    return null;
  }
}
