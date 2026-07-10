"use client";

import { countWords, type Answer, type StudentQuestion } from "./types";

type P = {
  q: StudentQuestion;
  value: Answer;
  onChange: (a: Answer) => void;
};

function WordBadge({
  words,
  min,
  max,
}: {
  words: number;
  min?: number;
  max?: number;
}) {
  const under = min !== undefined && words > 0 && words < min;
  const over = max !== undefined && words > max;
  const cls = over
    ? "bg-alert-bg text-alert"
    : under
      ? "bg-pending-bg text-pending"
      : "bg-cream-50 text-ink-muted border border-line";
  return (
    <span className={`figures rounded px-2 py-0.5 text-[12px] ${cls}`}>
      {words} word{words === 1 ? "" : "s"}
      {min !== undefined && max !== undefined ? ` · aim ${min}–${max}` : ""}
    </span>
  );
}

function TextArea({
  value,
  onChange,
  rows = 5,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      spellCheck={false}
      className="w-full rounded-md border border-line bg-paper px-3 py-2 text-[15px] leading-6 focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson resize-y"
    />
  );
}

function setText(value: Answer, i: number, v: string, size: number): Answer {
  const texts = [...(value.texts ?? Array(size).fill(""))];
  texts[i] = v;
  return { ...value, texts };
}

/** Part 1: five 1–5 word answers */
export function W1Form({ q, value, onChange }: P) {
  const questions = (q.options?.questions as { text: string }[]) ?? [];
  return (
    <div className="space-y-4">
      {questions.map((sub, i) => {
        const v = value.texts?.[i] ?? "";
        return (
          <div key={i}>
            <div className="flex items-center justify-between mb-1.5 gap-3">
              <p className="text-[15px]">
                <span className="figures text-ink-muted mr-2">{i + 1}.</span>
                {sub.text}
              </p>
              <WordBadge words={countWords(v)} max={5} />
            </div>
            <input
              value={v}
              onChange={(e) => onChange(setText(value, i, e.target.value, questions.length))}
              maxLength={60}
              spellCheck={false}
              className="w-full rounded-md border border-line bg-paper px-3 py-2 text-[15px] focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson"
            />
          </div>
        );
      })}
      <p className="text-[13px] text-ink-muted">Use 1–5 words per answer.</p>
    </div>
  );
}

/** Part 2: 20–30 word short text */
export function W2Short({ q, value, onChange }: P) {
  const min = (q.options?.min_words as number) ?? 20;
  const max = (q.options?.max_words as number) ?? 30;
  const v = value.text ?? "";
  return (
    <div className="space-y-2">
      <TextArea value={v} onChange={(text) => onChange({ ...value, text })} rows={4} />
      <WordBadge words={countWords(v)} min={min} max={max} />
    </div>
  );
}

/** Part 3: three chat replies, 30–40 words each */
export function W3Chat({ q, value, onChange }: P) {
  const messages = (q.options?.messages as { author: string; text: string }[]) ?? [];
  const min = (q.options?.min_words as number) ?? 30;
  const max = (q.options?.max_words as number) ?? 40;
  return (
    <div className="space-y-6">
      {messages.map((m, i) => {
        const v = value.texts?.[i] ?? "";
        return (
          <div key={i} className="space-y-2">
            <div className="rounded-card border border-line bg-cream-50 p-4">
              <p className="label-caps mb-1">{m.author}</p>
              <p className="text-[15px]">{m.text}</p>
            </div>
            <TextArea
              value={v}
              onChange={(t) => onChange(setText(value, i, t, messages.length))}
              rows={4}
              placeholder={`Reply to ${m.author}…`}
            />
            <WordBadge words={countWords(v)} min={min} max={max} />
          </div>
        );
      })}
    </div>
  );
}

/** Part 4: informal + formal email replies */
export function W4Email({ q, value, onChange }: P) {
  const email = q.options?.email as { subject: string; from: string; body: string } | undefined;
  const tasks =
    (q.options?.tasks as {
      register: string;
      audience?: string;
      min_words: number;
      max_words: number;
    }[]) ?? [];
  return (
    <div className="space-y-6">
      {email ? (
        <div className="rounded-card border border-line bg-cream-50 p-4">
          <p className="label-caps mb-0.5">From: {email.from}</p>
          <p className="text-[15px] font-medium mb-2">{email.subject}</p>
          <p className="text-[15px] leading-6 whitespace-pre-wrap">{email.body}</p>
        </div>
      ) : null}
      {tasks.map((t, i) => {
        const v = value.texts?.[i] ?? "";
        return (
          <div key={i} className="space-y-2">
            <p className="text-[15px]">
              <span className="figures text-ink-muted mr-2">{i + 1}.</span>
              Write a <strong>{t.register}</strong> reply
              {t.audience ? ` to ${t.audience}` : ""} ({t.min_words}–{t.max_words} words).
            </p>
            <TextArea
              value={v}
              onChange={(txt) => onChange(setText(value, i, txt, tasks.length))}
              rows={t.register === "formal" ? 10 : 5}
            />
            <WordBadge words={countWords(v)} min={t.min_words} max={t.max_words} />
          </div>
        );
      })}
    </div>
  );
}
