"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { validateQuestion, TYPE_PARTS, type ImportQuestion } from "@/lib/question-import";

/* ------------------------------------------------------------------ */
/* Type catalogue (label per question_type)                            */
/* ------------------------------------------------------------------ */
const TYPE_LABELS: Record<string, string> = {
  grammar_mc3: "Grammar — sentence completion (3 options)",
  vocab_set: "Vocabulary set (5 items, shared bank)",
  r1_gap_mc3: "Reading 1 — gap fill (3 options per gap)",
  r2_ordering: "Reading 2 — sentence ordering",
  r3_opinion_match: "Reading 3 — opinion matching (4 people)",
  r4_banked_cloze: "Reading 4 — banked gap fill",
  r5_heading_match: "Reading 5 — heading matching",
  l1_mc4: "Listening 1 — 4-option MC",
  l2_speaker_match: "Listening 2 — speaker matching",
  l3_opinion_id: "Listening 3 — man/woman/both",
  l4_monologue_mc: "Listening 4 — monologue (2 questions)",
  w1_form: "Writing 1 — short form (5 answers)",
  w2_short: "Writing 2 — short text",
  w3_chat: "Writing 3 — chat replies (3)",
  w4_email: "Writing 4 — two emails",
  s1_personal: "Speaking 1 — personal questions",
  s2_photo: "Speaking 2 — describe a photo",
  s3_compare: "Speaking 3 — compare two photos",
  s4_abstract: "Speaking 4 — abstract topic",
};

const TYPES_BY_MODULE: Record<string, string[]> = {
  core: ["grammar_mc3", "vocab_set"],
  reading: ["r1_gap_mc3", "r2_ordering", "r3_opinion_match", "r4_banked_cloze", "r5_heading_match"],
  listening: ["l1_mc4", "l2_speaker_match", "l3_opinion_id", "l4_monologue_mc"],
  writing: ["w1_form", "w2_short", "w3_chat", "w4_email"],
  speaking: ["s1_personal", "s2_photo", "s3_compare", "s4_abstract"],
};

const CEFR = ["A1", "A2", "B1", "B2", "C1", "C2"];

/* ------------------------------------------------------------------ */
/* Small field primitives                                              */
/* ------------------------------------------------------------------ */
const inputCls =
  "w-full rounded-md border border-line bg-paper px-3 py-2 text-[14px] focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson";

function Lbl({ children }: { children: React.ReactNode }) {
  return <label className="label-caps block mb-1.5">{children}</label>;
}

function Txt({
  label,
  value,
  onChange,
  placeholder,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      {label ? <Lbl>{label}</Lbl> : null}
      <input
        className={inputCls}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function Area({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div>
      {label ? <Lbl>{label}</Lbl> : null}
      <textarea
        className={`${inputCls} resize-y`}
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

/** Editable list of strings. */
function StringList({
  label,
  items,
  onChange,
  min = 1,
  fixed,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (v: string[]) => void;
  min?: number;
  fixed?: number;
  placeholder?: (i: number) => string;
}) {
  const set = (i: number, v: string) => {
    const next = [...items];
    next[i] = v;
    onChange(next);
  };
  return (
    <div>
      <Lbl>{label}</Lbl>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex gap-2">
            <span className="figures text-[12px] text-ink-muted w-5 pt-2.5">{i + 1}</span>
            <input
              className={inputCls}
              value={it}
              onChange={(e) => set(i, e.target.value)}
              placeholder={placeholder?.(i)}
            />
            {!fixed && items.length > min ? (
              <button
                type="button"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
                className="text-alert px-2 cursor-pointer"
                aria-label="Remove"
              >
                ×
              </button>
            ) : null}
          </div>
        ))}
      </div>
      {!fixed ? (
        <button
          type="button"
          onClick={() => onChange([...items, ""])}
          className="mt-2 text-[13px] text-crimson underline underline-offset-2 cursor-pointer"
        >
          + Add
        </button>
      ) : null}
    </div>
  );
}

/** Inline media uploader → returns the stored path in mock-media. */
function MediaField({
  label,
  folder,
  value,
  onChange,
  accept,
}: {
  label: string;
  folder: string;
  value: string;
  onChange: (path: string) => void;
  accept: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const isImage = accept.startsWith("image");

  // Preview the current media via a signed URL
  useEffect(() => {
    let cancelled = false;
    if (!value) {
      setPreviewUrl(null);
      return;
    }
    supabase.storage
      .from("mock-media")
      .createSignedUrl(value, 60 * 60)
      .then(({ data }) => {
        if (!cancelled) setPreviewUrl(data?.signedUrl ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [value, supabase]);

  async function upload(file: File) {
    setBusy(true);
    setErr("");
    const clean = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
    const path = `${folder}/${Date.now()}-${clean}`;
    const { error } = await supabase.storage.from("mock-media").upload(path, file, { upsert: true });
    setBusy(false);
    if (error) setErr(error.message);
    else onChange(path);
  }

  return (
    <div>
      <Lbl>{label}</Lbl>
      <div className="flex items-center gap-3">
        <input
          className={inputCls}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="path in mock-media, or upload →"
        />
        <label className="shrink-0 rounded-md border border-line bg-paper px-3 py-2 text-[13px] cursor-pointer hover:bg-cream-50">
          {busy ? "Uploading…" : "Upload"}
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
        </label>
      </div>
      {err ? <p className="text-alert text-[12px] mt-1">{err}</p> : null}
      {previewUrl ? (
        isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="preview" className="mt-2 h-28 rounded-md border border-line object-cover" />
        ) : (
          <audio src={previewUrl} controls className="mt-2 w-full max-w-sm" />
        )
      ) : value ? (
        <p className="text-[12px] text-ink-muted mt-1">Preview unavailable (file not found in storage).</p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main form                                                           */
/* ------------------------------------------------------------------ */
type Draft = ImportQuestion & { module: string };

export function QuestionForm({
  examCode,
  initial,
  questionId,
  saveAction,
}: {
  examCode: string;
  initial?: Draft;
  questionId?: string;
  saveAction: (payload: string) => Promise<{ error?: string } | void>;
}) {
  const router = useRouter();
  const isEdit = Boolean(questionId);
  const [module, setModule] = useState(initial?.module ?? "core");
  const [q, setQ] = useState<ImportQuestion>(
    initial ?? {
      question_type: "grammar_mc3",
      options: { choices: ["", "", ""] },
      correct_answers: { choice: 0 },
    }
  );
  const [saving, setSaving] = useState(false);
  const [serverErr, setServerErr] = useState("");

  const opts = (q.options ?? {}) as Record<string, unknown>;
  const correct = (q.correct_answers ?? {}) as Record<string, unknown>;

  function patch(p: Partial<ImportQuestion>) {
    setQ((prev) => ({ ...prev, ...p }));
  }
  function setOpt(key: string, val: unknown) {
    setQ((prev) => ({ ...prev, options: { ...(prev.options ?? {}), [key]: val } }));
  }
  function setCorrect(key: string, val: unknown) {
    setQ((prev) => ({ ...prev, correct_answers: { ...(prev.correct_answers ?? {}), [key]: val } }));
  }

  /** Reset shape when the type changes (so scaffolding matches the new type). */
  function changeType(type: string) {
    setQ(scaffold(type));
  }
  function changeModule(m: string) {
    setModule(m);
    changeType(TYPES_BY_MODULE[m][0]);
  }

  const errors = validateQuestion(q);
  const payload = JSON.stringify({ id: questionId, exam: examCode, module, question: q });

  async function submit() {
    if (errors.length) return;
    setSaving(true);
    setServerErr("");
    const res = await saveAction(payload);
    setSaving(false);
    if (res && "error" in res && res.error) setServerErr(res.error);
    // on success the action redirects
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Meta */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Lbl>Module</Lbl>
          <select
            className={inputCls}
            value={module}
            onChange={(e) => changeModule(e.target.value)}
            disabled={isEdit}
          >
            {Object.keys(TYPES_BY_MODULE).map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <Lbl>Question type</Lbl>
          <select
            className={inputCls}
            value={q.question_type}
            onChange={(e) => changeType(e.target.value)}
            disabled={isEdit}
          >
            {TYPES_BY_MODULE[module].map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Lbl>Difficulty (CEFR)</Lbl>
          <select
            className={inputCls}
            value={q.difficulty ?? ""}
            onChange={(e) => patch({ difficulty: e.target.value || undefined })}
          >
            <option value="">— unset —</option>
            {CEFR.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <Txt
          label="Tags (comma separated)"
          value={(q.tags ?? []).join(", ")}
          onChange={(v) =>
            patch({ tags: v.split(",").map((t) => t.trim()).filter(Boolean) })
          }
          placeholder="set-01, travel"
        />
      </div>

      {/* Type-specific editor */}
      <div className="border-t border-line pt-6 space-y-5">
        <TypeEditor
          type={q.question_type}
          q={q}
          opts={opts}
          correct={correct}
          patch={patch}
          setOpt={setOpt}
          setCorrect={setCorrect}
        />
      </div>

      {/* Validation + actions */}
      {errors.length > 0 ? (
        <div className="rounded-md bg-pending-bg text-pending px-3 py-2 text-[13px] space-y-1">
          <p className="font-medium">Fix before saving:</p>
          <ul className="list-disc pl-5">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      ) : null}
      {serverErr ? (
        <p className="rounded-md bg-alert-bg text-alert px-3 py-2 text-[13px]">{serverErr}</p>
      ) : null}

      <div className="flex gap-3">
        <Button onClick={submit} disabled={errors.length > 0 || saving}>
          {saving ? "Saving…" : isEdit ? "Save changes" : "Add question"}
        </Button>
        <Button variant="secondary" onClick={() => router.push("/dashboard/questions")}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Default scaffolding per type                                        */
/* ------------------------------------------------------------------ */
function scaffold(type: string): ImportQuestion {
  const base: ImportQuestion = { question_type: type, part: TYPE_PARTS[type]?.part };
  const S = (n: number) => Array(n).fill("");
  switch (type) {
    case "grammar_mc3":
      return { ...base, prompt: "", options: { choices: S(3) }, correct_answers: { choice: 0 } };
    case "l1_mc4":
      return { ...base, prompt: "", media: "", passage: "", options: { choices: S(4) }, correct_answers: { choice: 0 } };
    case "vocab_set":
      return { ...base, prompt: "", options: { kind: "synonym", bank: S(10), items: S(5).map(() => ({ text: "" })) }, correct_answers: { answers: S(5) } };
    case "r1_gap_mc3":
      return { ...base, prompt: "", passage: "", options: { gaps: [{ choices: S(3) }] }, correct_answers: { answers: S(1) } };
    case "r2_ordering":
      return { ...base, prompt: "", options: { fixed_first: "", sentences: S(4) }, correct_answers: { order: [0, 1, 2, 3] } };
    case "r3_opinion_match":
      return { ...base, prompt: "", options: { people: S(4).map((_, i) => ({ name: `Person ${String.fromCharCode(65 + i)}`, text: "" })), questions: S(1) }, correct_answers: { answers: [0] } };
    case "r4_banked_cloze":
      return { ...base, prompt: "", passage: "", options: { bank: S(6) }, correct_answers: { answers: S(1) } };
    case "r5_heading_match":
      return { ...base, prompt: "", options: { paragraphs: S(3), headings: S(4) }, correct_answers: { answers: [0, 0, 0] } };
    case "l2_speaker_match":
      return { ...base, prompt: "", media: "", passage: "", options: { statements: S(4) }, correct_answers: { answers: [0, 0, 0, 0] } };
    case "l3_opinion_id":
      return { ...base, prompt: "", media: "", passage: "", options: { statements: S(2) }, correct_answers: { answers: ["man", "man"] } };
    case "l4_monologue_mc":
      return { ...base, prompt: "", media: "", passage: "", options: { questions: [{ text: "", choices: S(4) }, { text: "", choices: S(4) }] }, correct_answers: { answers: [0, 0] } };
    case "w1_form":
      return { ...base, prompt: "", options: { questions: S(5).map(() => ({ text: "" })) } };
    case "w2_short":
      return { ...base, prompt: "", options: { min_words: 20, max_words: 30 } };
    case "w3_chat":
      return { ...base, prompt: "", options: { messages: S(3).map(() => ({ author: "", text: "" })), min_words: 30, max_words: 40 } };
    case "w4_email":
      return { ...base, prompt: "", options: { email: { subject: "", from: "", body: "" }, tasks: [{ register: "informal", min_words: 40, max_words: 50 }, { register: "formal", min_words: 120, max_words: 150 }] } };
    case "s1_personal":
      return { ...base, prompt: "", options: { questions: S(3), response_seconds: 30 } };
    case "s2_photo":
      return { ...base, prompt: "", media: "", options: { questions: S(3), response_seconds: 45 } };
    case "s3_compare":
      return { ...base, prompt: "", options: { images: S(2), questions: S(3), response_seconds: 45 } };
    case "s4_abstract":
      return { ...base, prompt: "", options: { questions: S(3), prep_seconds: 60, response_seconds: 120 } };
    default:
      return base;
  }
}

/* ------------------------------------------------------------------ */
/* Per-type editors                                                    */
/* ------------------------------------------------------------------ */
type EditorProps = {
  type: string;
  q: ImportQuestion;
  opts: Record<string, unknown>;
  correct: Record<string, unknown>;
  patch: (p: Partial<ImportQuestion>) => void;
  setOpt: (k: string, v: unknown) => void;
  setCorrect: (k: string, v: unknown) => void;
};

function TypeEditor({ type, q, opts, correct, patch, setOpt, setCorrect }: EditorProps) {
  const choices = (opts.choices as string[]) ?? [];
  const answers = (correct.answers as (string | number)[]) ?? [];

  const Prompt = (label = "Prompt / instruction", rows = 2) => (
    <Area label={label} value={q.prompt ?? ""} onChange={(v) => patch({ prompt: v })} rows={rows} />
  );
  const Listening = () => (
    <>
      <Area label="Transcript" value={q.passage ?? ""} onChange={(v) => patch({ passage: v })} rows={4} />
      <p className="text-[12px] text-ink-muted -mt-2">
        Audio is voiced from this transcript on the Listening audio page — no
        upload needed. Use cues like <code>[Man]</code> / <code>[Woman]</code> for
        distinct speaker voices. To use your own recording instead, upload it below.
      </p>
      <MediaField label="Audio (optional)" folder="listening" accept="audio/*" value={q.media ?? ""} onChange={(p) => patch({ media: p })} />
    </>
  );

  // MC single-correct (grammar, l1)
  const McSingle = (n: number) => (
    <div>
      <Lbl>Options (select the correct one)</Lbl>
      <div className="space-y-2">
        {Array.from({ length: n }).map((_, i) => (
          <label key={i} className="flex items-center gap-3">
            <input
              type="radio"
              checked={(correct.choice ?? 0) === i}
              onChange={() => setCorrect("choice", i)}
              className="accent-[var(--crimson)]"
            />
            <input
              className={inputCls}
              value={choices[i] ?? ""}
              onChange={(e) => {
                const next = [...choices];
                next[i] = e.target.value;
                setOpt("choices", next);
              }}
            />
          </label>
        ))}
      </div>
    </div>
  );

  switch (type) {
    case "grammar_mc3":
      return (
        <>
          {Prompt("Sentence with a gap (use ______ )")}
          {McSingle(3)}
        </>
      );
    case "l1_mc4":
      return (
        <>
          {Prompt("Question")}
          {Listening()}
          {McSingle(4)}
        </>
      );
    case "vocab_set": {
      const bank = (opts.bank as string[]) ?? [];
      const items = (opts.items as { text: string }[]) ?? [];
      return (
        <>
          {Prompt("Instruction")}
          <div>
            <Lbl>Kind</Lbl>
            <select className={inputCls} value={(opts.kind as string) ?? "synonym"} onChange={(e) => setOpt("kind", e.target.value)}>
              {["synonym", "definition", "usage", "collocation", "matching"].map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </div>
          <StringList label="Bank (10 options)" items={bank} onChange={(v) => setOpt("bank", v)} />
          <div>
            <Lbl>Items (5) — pick each answer from the bank</Lbl>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className={inputCls}
                    placeholder={`prompt word ${i + 1}`}
                    value={it.text}
                    onChange={(e) => {
                      const next = items.map((x, j) => (j === i ? { text: e.target.value } : x));
                      setOpt("items", next);
                    }}
                  />
                  <select
                    className={inputCls}
                    value={(answers[i] as string) ?? ""}
                    onChange={(e) => {
                      const next = [...answers];
                      next[i] = e.target.value;
                      setCorrect("answers", next);
                    }}
                  >
                    <option value="">answer…</option>
                    {bank.filter(Boolean).map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </>
      );
    }
    case "r1_gap_mc3": {
      const gaps = (opts.gaps as { choices: string[] }[]) ?? [];
      return (
        <>
          {Prompt("Instruction")}
          <Area label="Passage — mark gaps [[1]], [[2]] …" value={q.passage ?? ""} onChange={(v) => patch({ passage: v })} rows={4} />
          <div className="space-y-4">
            {gaps.map((g, gi) => (
              <div key={gi} className="border border-line rounded-md p-3">
                <p className="label-caps mb-2">Gap {gi + 1}</p>
                <div className="space-y-2">
                  {g.choices.map((c, ci) => (
                    <label key={ci} className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={(answers[gi] as string) === c && c !== ""}
                        onChange={() => {
                          const next = [...answers];
                          next[gi] = c;
                          setCorrect("answers", next);
                        }}
                        className="accent-[var(--crimson)]"
                      />
                      <input
                        className={inputCls}
                        value={c}
                        onChange={(e) => {
                          const ng = gaps.map((x, j) => (j === gi ? { choices: x.choices.map((y, k) => (k === ci ? e.target.value : y)) } : x));
                          setOpt("gaps", ng);
                        }}
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <button
              type="button"
              className="text-[13px] text-crimson underline underline-offset-2 cursor-pointer"
              onClick={() => {
                setOpt("gaps", [...gaps, { choices: ["", "", ""] }]);
                setCorrect("answers", [...answers, ""]);
              }}
            >
              + Add gap
            </button>
          </div>
        </>
      );
    }
    case "r4_banked_cloze": {
      const bank = (opts.bank as string[]) ?? [];
      const gapCount = ((q.passage ?? "").match(/\[\[\d+\]\]/g) ?? []).length;
      return (
        <>
          {Prompt("Instruction")}
          <Area label="Passage — mark gaps [[1]], [[2]] …" value={q.passage ?? ""} onChange={(v) => patch({ passage: v })} rows={5} />
          <StringList label="Word bank (include distractors)" items={bank} onChange={(v) => setOpt("bank", v)} />
          <div>
            <Lbl>Answer for each gap ({gapCount} detected)</Lbl>
            <div className="space-y-2">
              {Array.from({ length: gapCount }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="figures text-[12px] text-ink-muted w-8">[[{i + 1}]]</span>
                  <select
                    className={inputCls}
                    value={(answers[i] as string) ?? ""}
                    onChange={(e) => {
                      const next = [...answers];
                      next[i] = e.target.value;
                      setCorrect("answers", next);
                    }}
                  >
                    <option value="">choose…</option>
                    {bank.filter(Boolean).map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </>
      );
    }
    case "r2_ordering": {
      const sentences = (opts.sentences as string[]) ?? [];
      const order = (correct.order as number[]) ?? sentences.map((_, i) => i);
      return (
        <>
          {Prompt("Instruction")}
          <Txt label="First sentence (fixed, shown to student)" value={(opts.fixed_first as string) ?? ""} onChange={(v) => setOpt("fixed_first", v)} />
          <StringList label="Jumbled sentences (author order)" items={sentences} onChange={(v) => { setOpt("sentences", v); setCorrect("order", v.map((_, i) => i)); }} />
          <div>
            <Lbl>Correct order (indices into the list above, 0-based)</Lbl>
            <Txt value={order.join(", ")} onChange={(v) => setCorrect("order", v.split(",").map((n) => Number(n.trim())).filter((n) => !Number.isNaN(n)))} placeholder="2, 0, 3, 1" />
          </div>
        </>
      );
    }
    case "r3_opinion_match": {
      const people = (opts.people as { name: string; text: string }[]) ?? [];
      const questions = (opts.questions as string[]) ?? [];
      return (
        <>
          {Prompt("Instruction")}
          <div className="space-y-2">
            <Lbl>People (4)</Lbl>
            {people.map((p, i) => (
              <div key={i} className="flex gap-2">
                <input className={`${inputCls} w-32`} value={p.name} onChange={(e) => setOpt("people", people.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                <input className={inputCls} placeholder="opinion text" value={p.text} onChange={(e) => setOpt("people", people.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
              </div>
            ))}
          </div>
          <div>
            <Lbl>Questions — pick who says each</Lbl>
            <div className="space-y-2">
              {questions.map((qq, i) => (
                <div key={i} className="flex gap-2">
                  <input className={inputCls} value={qq} onChange={(e) => setOpt("questions", questions.map((x, j) => (j === i ? e.target.value : x)))} />
                  <select className={`${inputCls} w-36`} value={(answers[i] as number) ?? 0} onChange={(e) => { const next = [...answers]; next[i] = Number(e.target.value); setCorrect("answers", next); }}>
                    {people.map((p, pi) => (
                      <option key={pi} value={pi}>{p.name}</option>
                    ))}
                  </select>
                  <button type="button" className="text-alert px-2 cursor-pointer" onClick={() => { setOpt("questions", questions.filter((_, j) => j !== i)); setCorrect("answers", answers.filter((_, j) => j !== i)); }}>×</button>
                </div>
              ))}
            </div>
            <button type="button" className="mt-2 text-[13px] text-crimson underline underline-offset-2 cursor-pointer" onClick={() => { setOpt("questions", [...questions, ""]); setCorrect("answers", [...answers, 0]); }}>+ Add question</button>
          </div>
        </>
      );
    }
    case "r5_heading_match": {
      const paragraphs = (opts.paragraphs as string[]) ?? [];
      const headings = (opts.headings as string[]) ?? [];
      return (
        <>
          {Prompt("Instruction")}
          <StringList label="Headings (one spare)" items={headings} onChange={(v) => setOpt("headings", v)} />
          <div>
            <Lbl>Paragraphs — pick the correct heading for each</Lbl>
            <div className="space-y-2">
              {paragraphs.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <textarea className={`${inputCls} resize-y`} rows={2} value={p} onChange={(e) => setOpt("paragraphs", paragraphs.map((x, j) => (j === i ? e.target.value : x)))} />
                  <select className={`${inputCls} w-40`} value={(answers[i] as number) ?? 0} onChange={(e) => { const next = [...answers]; next[i] = Number(e.target.value); setCorrect("answers", next); }}>
                    {headings.map((h, hi) => (
                      <option key={hi} value={hi}>{h || `heading ${hi + 1}`}</option>
                    ))}
                  </select>
                  <button type="button" className="text-alert px-2 cursor-pointer" onClick={() => { setOpt("paragraphs", paragraphs.filter((_, j) => j !== i)); setCorrect("answers", answers.filter((_, j) => j !== i)); }}>×</button>
                </div>
              ))}
            </div>
            <button type="button" className="mt-2 text-[13px] text-crimson underline underline-offset-2 cursor-pointer" onClick={() => { setOpt("paragraphs", [...paragraphs, ""]); setCorrect("answers", [...answers, 0]); }}>+ Add paragraph</button>
          </div>
        </>
      );
    }
    case "l2_speaker_match": {
      const statements = (opts.statements as string[]) ?? [];
      return (
        <>
          {Prompt("Instruction")}
          {Listening()}
          <div>
            <Lbl>Statements — pick the speaker (A–D)</Lbl>
            <div className="space-y-2">
              {statements.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input className={inputCls} value={s} onChange={(e) => setOpt("statements", statements.map((x, j) => (j === i ? e.target.value : x)))} />
                  <select className={`${inputCls} w-32`} value={(answers[i] as number) ?? 0} onChange={(e) => { const next = [...answers]; next[i] = Number(e.target.value); setCorrect("answers", next); }}>
                    {["A", "B", "C", "D"].map((sp, si) => (
                      <option key={si} value={si}>Speaker {sp}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </>
      );
    }
    case "l3_opinion_id": {
      const statements = (opts.statements as string[]) ?? [];
      return (
        <>
          {Prompt("Instruction")}
          {Listening()}
          <div>
            <Lbl>Statements — man / woman / both</Lbl>
            <div className="space-y-2">
              {statements.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input className={inputCls} value={s} onChange={(e) => setOpt("statements", statements.map((x, j) => (j === i ? e.target.value : x)))} />
                  <select className={`${inputCls} w-28`} value={(answers[i] as string) ?? "man"} onChange={(e) => { const next = [...answers]; next[i] = e.target.value; setCorrect("answers", next); }}>
                    {["man", "woman", "both"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <button type="button" className="mt-2 text-[13px] text-crimson underline underline-offset-2 cursor-pointer" onClick={() => { setOpt("statements", [...statements, ""]); setCorrect("answers", [...answers, "man"]); }}>+ Add statement</button>
          </div>
        </>
      );
    }
    case "l4_monologue_mc": {
      const questions = (opts.questions as { text: string; choices: string[] }[]) ?? [];
      return (
        <>
          {Prompt("Instruction")}
          {Listening()}
          <div className="space-y-4">
            {questions.map((sub, qi) => (
              <div key={qi} className="border border-line rounded-md p-3 space-y-2">
                <Txt label={`Question ${qi + 1}`} value={sub.text} onChange={(v) => setOpt("questions", questions.map((x, j) => (j === qi ? { ...x, text: v } : x)))} />
                {sub.choices.map((c, ci) => (
                  <label key={ci} className="flex items-center gap-3">
                    <input type="radio" checked={(answers[qi] as number) === ci} onChange={() => { const next = [...answers]; next[qi] = ci; setCorrect("answers", next); }} className="accent-[var(--crimson)]" />
                    <input className={inputCls} value={c} onChange={(e) => setOpt("questions", questions.map((x, j) => (j === qi ? { ...x, choices: x.choices.map((y, k) => (k === ci ? e.target.value : y)) } : x)))} />
                  </label>
                ))}
              </div>
            ))}
          </div>
        </>
      );
    }
    case "w1_form": {
      const questions = (opts.questions as { text: string }[]) ?? [];
      return (
        <>
          {Prompt("Scenario / instruction")}
          <div className="space-y-2">
            <Lbl>Five short questions (1–5 word answers)</Lbl>
            {questions.map((it, i) => (
              <input key={i} className={inputCls} value={it.text} onChange={(e) => setOpt("questions", questions.map((x, j) => (j === i ? { text: e.target.value } : x)))} />
            ))}
          </div>
        </>
      );
    }
    case "w2_short":
      return (
        <>
          {Prompt("Task", 3)}
          <div className="grid grid-cols-2 gap-4">
            <Txt label="Min words" value={String(opts.min_words ?? "")} onChange={(v) => setOpt("min_words", Number(v) || 0)} />
            <Txt label="Max words" value={String(opts.max_words ?? "")} onChange={(v) => setOpt("max_words", Number(v) || 0)} />
          </div>
        </>
      );
    case "w3_chat": {
      const messages = (opts.messages as { author: string; text: string }[]) ?? [];
      return (
        <>
          {Prompt("Instruction")}
          <div className="space-y-2">
            <Lbl>Three chat messages</Lbl>
            {messages.map((m, i) => (
              <div key={i} className="flex gap-2">
                <input className={`${inputCls} w-32`} placeholder="author" value={m.author} onChange={(e) => setOpt("messages", messages.map((x, j) => (j === i ? { ...x, author: e.target.value } : x)))} />
                <input className={inputCls} placeholder="message" value={m.text} onChange={(e) => setOpt("messages", messages.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Txt label="Min words" value={String(opts.min_words ?? "")} onChange={(v) => setOpt("min_words", Number(v) || 0)} />
            <Txt label="Max words" value={String(opts.max_words ?? "")} onChange={(v) => setOpt("max_words", Number(v) || 0)} />
          </div>
        </>
      );
    }
    case "w4_email": {
      const email = (opts.email as { subject: string; from: string; body: string }) ?? { subject: "", from: "", body: "" };
      const tasks = (opts.tasks as { register: string; audience?: string; min_words: number; max_words: number }[]) ?? [];
      return (
        <>
          {Prompt("Instruction")}
          <div className="border border-line rounded-md p-3 space-y-2">
            <Lbl>Received email</Lbl>
            <Txt label="From" value={email.from} onChange={(v) => setOpt("email", { ...email, from: v })} />
            <Txt label="Subject" value={email.subject} onChange={(v) => setOpt("email", { ...email, subject: v })} />
            <Area label="Body" value={email.body} onChange={(v) => setOpt("email", { ...email, body: v })} rows={4} />
          </div>
          {tasks.map((t, i) => (
            <div key={i} className="border border-line rounded-md p-3 grid grid-cols-2 gap-3">
              <Txt label="Register" value={t.register} onChange={(v) => setOpt("tasks", tasks.map((x, j) => (j === i ? { ...x, register: v } : x)))} />
              <Txt label="Audience" value={t.audience ?? ""} onChange={(v) => setOpt("tasks", tasks.map((x, j) => (j === i ? { ...x, audience: v } : x)))} />
              <Txt label="Min words" value={String(t.min_words)} onChange={(v) => setOpt("tasks", tasks.map((x, j) => (j === i ? { ...x, min_words: Number(v) || 0 } : x)))} />
              <Txt label="Max words" value={String(t.max_words)} onChange={(v) => setOpt("tasks", tasks.map((x, j) => (j === i ? { ...x, max_words: Number(v) || 0 } : x)))} />
            </div>
          ))}
        </>
      );
    }
    case "s1_personal":
    case "s4_abstract": {
      const questions = (opts.questions as string[]) ?? [];
      return (
        <>
          {Prompt("Instruction")}
          <StringList label="Questions (3)" items={questions} onChange={(v) => setOpt("questions", v)} fixed={3} />
          {type === "s4_abstract" ? (
            <Txt label="Preparation seconds" value={String(opts.prep_seconds ?? "")} onChange={(v) => setOpt("prep_seconds", Number(v) || 0)} />
          ) : null}
          <Txt label="Response seconds" value={String(opts.response_seconds ?? "")} onChange={(v) => setOpt("response_seconds", Number(v) || 0)} />
        </>
      );
    }
    case "s2_photo": {
      const questions = (opts.questions as string[]) ?? [];
      return (
        <>
          {Prompt("Instruction")}
          <Txt
            label="Image prompt (what the AI photo should show)"
            value={(opts.image_prompt as string) ?? ""}
            onChange={(v) => setOpt("image_prompt", v)}
            placeholder="a busy outdoor street market"
          />
          <p className="text-[12px] text-ink-muted -mt-2">
            Leave the photo below blank to generate it from this prompt on the
            Speaking images page. Or upload your own.
          </p>
          <MediaField label="Photo (optional)" folder="speaking" accept="image/*" value={q.media ?? ""} onChange={(p) => patch({ media: p })} />
          <StringList label="Questions (3)" items={questions} onChange={(v) => setOpt("questions", v)} fixed={3} />
          <Txt label="Response seconds" value={String(opts.response_seconds ?? "")} onChange={(v) => setOpt("response_seconds", Number(v) || 0)} />
        </>
      );
    }
    case "s3_compare": {
      const questions = (opts.questions as string[]) ?? [];
      const images = (opts.images as string[]) ?? ["", ""];
      const iprompts = (opts.image_prompts as string[]) ?? ["", ""];
      return (
        <>
          {Prompt("Instruction")}
          <Txt label="Image prompt 1" value={iprompts[0] ?? ""} onChange={(v) => setOpt("image_prompts", [v, iprompts[1] ?? ""])} placeholder="a quiet public library reading room" />
          <Txt label="Image prompt 2" value={iprompts[1] ?? ""} onChange={(v) => setOpt("image_prompts", [iprompts[0] ?? "", v])} placeholder="a lively coffee shop" />
          <p className="text-[12px] text-ink-muted -mt-2">
            Leave the photos below blank to generate them from these prompts on the
            Speaking images page.
          </p>
          <MediaField label="Photo 1 (optional)" folder="speaking" accept="image/*" value={images[0] ?? ""} onChange={(p) => setOpt("images", [p, images[1] ?? ""])} />
          <MediaField label="Photo 2 (optional)" folder="speaking" accept="image/*" value={images[1] ?? ""} onChange={(p) => setOpt("images", [images[0] ?? "", p])} />
          <StringList label="Questions (3)" items={questions} onChange={(v) => setOpt("questions", v)} fixed={3} />
          <Txt label="Response seconds" value={String(opts.response_seconds ?? "")} onChange={(v) => setOpt("response_seconds", Number(v) || 0)} />
        </>
      );
    }
    default:
      return <p className="text-ink-muted text-[13px]">No editor for this type.</p>;
  }
}
