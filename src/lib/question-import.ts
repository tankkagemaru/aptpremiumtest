/**
 * Question bulk-import format for the mock test platform.
 *
 * A file is JSON: { exam: "aptis-general", module: "...", questions: [ ... ] }
 * Full format documentation: docs/question-import-format.md
 */

export const MODULES = [
  "core",
  "reading",
  "listening",
  "writing",
  "speaking",
] as const;
export type Module = (typeof MODULES)[number];

/** question_type → default APTIS part */
export const TYPE_PARTS: Record<string, { module: Module; part: number }> = {
  grammar_mc3: { module: "core", part: 1 },
  vocab_set: { module: "core", part: 2 },
  r1_gap_mc3: { module: "reading", part: 1 },
  r2_ordering: { module: "reading", part: 2 },
  r3_opinion_match: { module: "reading", part: 3 },
  r4_banked_cloze: { module: "reading", part: 4 },
  r5_heading_match: { module: "reading", part: 5 },
  l1_mc4: { module: "listening", part: 1 },
  l2_speaker_match: { module: "listening", part: 2 },
  l3_opinion_id: { module: "listening", part: 3 },
  l4_monologue_mc: { module: "listening", part: 4 },
  w1_form: { module: "writing", part: 1 },
  w2_short: { module: "writing", part: 2 },
  w3_chat: { module: "writing", part: 3 },
  w4_email: { module: "writing", part: 4 },
  s1_personal: { module: "speaking", part: 1 },
  s2_photo: { module: "speaking", part: 2 },
  s3_compare: { module: "speaking", part: 3 },
  s4_abstract: { module: "speaking", part: 4 },
};

const CEFR = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"];

export type ImportQuestion = {
  question_type: string;
  part?: number;
  prompt?: string;
  passage?: string;
  media?: string;
  options?: Record<string, unknown>;
  correct_answers?: Record<string, unknown>;
  points?: number;
  difficulty?: string;
  tags?: string[];
};

export type ImportFile = {
  exam: string;
  module: Module;
  questions: ImportQuestion[];
};

type Opts = Record<string, unknown>;
const isArr = (v: unknown, n?: number): v is unknown[] =>
  Array.isArray(v) && (n === undefined || v.length === n);
const isStrArr = (v: unknown, n?: number) =>
  isArr(v, n) && (v as unknown[]).every((x) => typeof x === "string");

/** Per-type structural checks. Returns error messages (empty = valid). */
function checkQuestion(q: ImportQuestion): string[] {
  const e: string[] = [];
  const o = (q.options ?? {}) as Opts;
  const c = (q.correct_answers ?? {}) as Opts;
  const t = q.question_type;

  const needAnswers = () => {
    if (!q.correct_answers) e.push("correct_answers is required");
  };

  switch (t) {
    case "grammar_mc3":
      if (!q.prompt) e.push("prompt (the gapped sentence) is required");
      if (!isStrArr(o.choices, 3)) e.push("options.choices must be 3 strings");
      needAnswers();
      if (typeof c.choice !== "number") e.push("correct_answers.choice must be a 0-based index");
      break;
    case "vocab_set":
      if (!isStrArr(o.bank)) e.push("options.bank must be an array of option strings");
      if (!isArr(o.items, 5)) e.push("options.items must be 5 items");
      if (!isStrArr(c.answers, 5)) e.push("correct_answers.answers must be 5 strings from the bank");
      if (typeof o.kind !== "string") e.push("options.kind (matching|definition|usage|synonym|collocation) is required");
      break;
    case "r1_gap_mc3":
      if (!q.passage) e.push("passage with [[n]] gap markers is required");
      if (!isArr(o.gaps)) e.push("options.gaps must be an array of {choices:[3 strings]}");
      if (!isStrArr(c.answers)) e.push("correct_answers.answers must be an array of strings");
      break;
    case "r2_ordering":
      if (typeof o.fixed_first !== "string") e.push("options.fixed_first (example sentence) is required");
      if (!isStrArr(o.sentences)) e.push("options.sentences must be the jumbled sentences");
      if (!isArr(c.order)) e.push("correct_answers.order must be an array of 0-based indices");
      break;
    case "r3_opinion_match":
      if (!isArr(o.people, 4)) e.push("options.people must be 4 {name,text} objects");
      if (!isStrArr(o.questions)) e.push("options.questions must be an array of strings");
      if (!isArr(c.answers)) e.push("correct_answers.answers must map each question to a person index");
      break;
    case "r4_banked_cloze":
      if (!q.passage) e.push("passage with [[n]] gap markers is required");
      if (!isStrArr(o.bank)) e.push("options.bank must be an array of words");
      if (!isStrArr(c.answers)) e.push("correct_answers.answers must be an array of strings");
      break;
    case "r5_heading_match":
      if (!isStrArr(o.paragraphs)) e.push("options.paragraphs must be the text paragraphs");
      if (!isStrArr(o.headings)) e.push("options.headings must be the heading list");
      if (!isArr(c.answers)) e.push("correct_answers.answers must map each paragraph to a heading index");
      break;
    // Listening: audio is generated from the transcript (passage), so `media`
    // is optional — supply it only to use your own recording instead.
    case "l1_mc4":
      if (!q.passage) e.push("passage (audio transcript) is required");
      if (!isStrArr(o.choices, 4)) e.push("options.choices must be 4 strings");
      if (typeof c.choice !== "number") e.push("correct_answers.choice must be a 0-based index");
      break;
    case "l2_speaker_match":
      if (!q.passage) e.push("passage (transcript) is required");
      if (!isStrArr(o.statements)) e.push("options.statements must be an array");
      if (!isArr(c.answers)) e.push("correct_answers.answers must map statements to speakers (0-3)");
      break;
    case "l3_opinion_id":
      if (!q.passage) e.push("passage (transcript) is required");
      if (!isStrArr(o.statements)) e.push("options.statements must be an array");
      if (!isArr(c.answers)) e.push('correct_answers.answers must be "man"|"woman"|"both" per statement');
      break;
    case "l4_monologue_mc":
      if (!q.passage) e.push("passage (transcript) is required");
      if (!isArr(o.questions)) e.push("options.questions must be [{text, choices:[4]}]");
      if (!isArr(c.answers)) e.push("correct_answers.answers must be 0-based indices per question");
      break;
    case "w1_form":
      if (!isArr(o.questions, 5)) e.push("options.questions must be 5 {text} items (1–5 word answers)");
      break;
    case "w2_short":
      if (!q.prompt) e.push("prompt is required");
      break;
    case "w3_chat":
      if (!isArr(o.messages, 3)) e.push("options.messages must be 3 {author,text} items");
      break;
    case "w4_email":
      if (typeof o.email !== "object" || o.email === null)
        e.push("options.email {subject,from,body} is required");
      if (!isArr(o.tasks, 2)) e.push("options.tasks must be 2 {register,min_words,max_words} items");
      break;
    case "s1_personal":
      if (!isStrArr(o.questions, 3)) e.push("options.questions must be 3 strings");
      break;
    case "s2_photo":
      if (!q.media) e.push("media (image path) is required");
      if (!isStrArr(o.questions, 3)) e.push("options.questions must be 3 strings");
      break;
    case "s3_compare":
      if (!isStrArr(o.images, 2)) e.push("options.images must be 2 image paths");
      if (!isStrArr(o.questions, 3)) e.push("options.questions must be 3 strings");
      break;
    case "s4_abstract":
      if (!isStrArr(o.questions, 3)) e.push("options.questions must be 3 strings");
      break;
    default:
      e.push(`unknown question_type "${t}"`);
  }

  if (q.difficulty && !CEFR.includes(q.difficulty))
    e.push(`difficulty must be one of ${CEFR.join(", ")}`);
  return e;
}

/** Validate a single question (used by the form-based editor). */
export function validateQuestion(q: ImportQuestion): string[] {
  if (!TYPE_PARTS[q.question_type]) {
    return [`unknown question_type "${q.question_type}"`];
  }
  return checkQuestion(q);
}

export type ValidationResult = {
  ok: boolean;
  errors: string[];
  file?: ImportFile;
};

export function validateImportFile(raw: unknown): ValidationResult {
  const errors: string[] = [];
  if (typeof raw !== "object" || raw === null)
    return { ok: false, errors: ["File is not a JSON object"] };
  const f = raw as Partial<ImportFile>;

  if (typeof f.exam !== "string") errors.push('Missing "exam" (e.g. "aptis-general")');
  if (!f.module || !MODULES.includes(f.module))
    errors.push(`"module" must be one of ${MODULES.join(", ")}`);
  if (!Array.isArray(f.questions) || f.questions.length === 0)
    errors.push('"questions" must be a non-empty array');
  if (errors.length) return { ok: false, errors };

  f.questions!.forEach((q, i) => {
    const declared = TYPE_PARTS[q.question_type];
    if (!declared) {
      errors.push(`Question ${i + 1}: unknown question_type "${q.question_type}"`);
      return;
    }
    if (declared.module !== f.module)
      errors.push(
        `Question ${i + 1}: type ${q.question_type} belongs to module "${declared.module}", file says "${f.module}"`
      );
    checkQuestion(q).forEach((msg) =>
      errors.push(`Question ${i + 1} (${q.question_type}): ${msg}`)
    );
  });

  return { ok: errors.length === 0, errors, file: f as ImportFile };
}
