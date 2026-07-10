/**
 * AI writing evaluation — APTIS General writing rubric, via the OpenAI API.
 *
 * Produces a *suggestion only*: a 0–50 scale score plus rubric breakdown and
 * per-task notes that a teacher then approves or overrides. Never final on its own.
 *
 * Degrades gracefully: if OPENAI_API_KEY is not set, returns null and the
 * grading UI falls back to manual-only entry.
 */

export type RubricBreakdown = {
  task_fulfilment: number; // 0–5
  coherence: number; // 0–5
  grammar: number; // 0–5
  vocabulary: number; // 0–5
};

export type WritingEvaluation = {
  scale_score: number; // 0–50 (suggested module score)
  cefr: string; // suggested band, e.g. "B1"
  rubric: RubricBreakdown;
  summary: string; // 1–3 sentences overall
  per_task: { part: number; note: string }[];
  model: string;
};

export type WritingTaskInput = {
  part: number;
  prompt: string;
  answer: string; // concatenated student text for the part
};

const RUBRIC_GUIDE = `
APTIS General Writing is reported on a 0–50 scale mapped to CEFR (A0<10, A1 10–17, A2 18–25, B1 26–33, B2 34–41, C1 42–45, C2 46–50).
Judge four dimensions, each 0–5:
- task_fulfilment: did the writer do what each task asked, at the required length and register (Part 4 needs distinct informal vs formal tone)?
- coherence: organisation, linking, paragraphing.
- grammar: range and accuracy of structures for the level.
- vocabulary: range and precision of lexis for the level.
Be a fair but rigorous examiner. A blank or off-topic response scores near 0.
`.trim();

export function isAiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function evaluateWriting(
  tasks: WritingTaskInput[]
): Promise<WritingEvaluation | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const model = process.env.OPENAI_MODEL || "gpt-4o";

  const taskBlock = tasks
    .map(
      (t) =>
        `--- Part ${t.part} ---\nPROMPT: ${t.prompt}\nSTUDENT RESPONSE:\n${t.answer || "(no answer)"}`
    )
    .join("\n\n");

  const system = `You are an experienced APTIS examiner. ${RUBRIC_GUIDE}
Return ONLY JSON matching:
{"rubric":{"task_fulfilment":n,"coherence":n,"grammar":n,"vocabulary":n},
 "scale_score":n,"cefr":"A1|A2|B1|B2|C1|C2","summary":"...",
 "per_task":[{"part":n,"note":"..."}]}
scale_score must be 0–50 and consistent with the rubric and the CEFR band you assign.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: `Evaluate this submission.\n\n${taskBlock}` },
        ],
      }),
    });
    if (!res.ok) {
      console.error("OpenAI writing eval failed:", res.status, await res.text());
      return null;
    }
    const data = await res.json();
    const parsed = JSON.parse(data.choices[0].message.content);
    const clamp = (n: unknown) => Math.max(0, Math.min(5, Number(n) || 0));
    return {
      scale_score: Math.max(0, Math.min(50, Number(parsed.scale_score) || 0)),
      cefr: String(parsed.cefr ?? ""),
      rubric: {
        task_fulfilment: clamp(parsed.rubric?.task_fulfilment),
        coherence: clamp(parsed.rubric?.coherence),
        grammar: clamp(parsed.rubric?.grammar),
        vocabulary: clamp(parsed.rubric?.vocabulary),
      },
      summary: String(parsed.summary ?? ""),
      per_task: Array.isArray(parsed.per_task) ? parsed.per_task : [],
      model,
    };
  } catch (e) {
    console.error("OpenAI writing eval error:", e);
    return null;
  }
}
