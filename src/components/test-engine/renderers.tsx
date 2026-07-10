"use client";

import { type ReactNode } from "react";
import { AudioPlayer } from "./audio-player";
import { W1Form, W2Short, W3Chat, W4Email } from "./renderers-writing";
import { SpeakingTask } from "./speaking-task";
import type { Answer, RunnerCtx, StudentQuestion } from "./types";

type P = {
  q: StudentQuestion;
  value: Answer;
  onChange: (a: Answer) => void;
  ctx: RunnerCtx;
};

const selectCls =
  "rounded-md border border-line bg-paper px-2 py-1.5 text-[14px] focus:outline-none focus:border-crimson";

function Radio({
  name,
  checked,
  onSelect,
  children,
}: {
  name: string;
  checked: boolean;
  onSelect: () => void;
  children: ReactNode;
}) {
  return (
    <label
      className={`flex items-start gap-3 rounded-md border px-3 py-2.5 cursor-pointer text-[15px] transition-colors ${
        checked ? "border-crimson bg-crimson-bg" : "border-line bg-paper hover:bg-cream-50"
      }`}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onSelect}
        className="mt-1 accent-[var(--crimson)]"
      />
      <span>{children}</span>
    </label>
  );
}

function setAnswerAt(value: Answer, i: number, v: string | number | null, size: number): Answer {
  const answers = [...(value.answers ?? Array(size).fill(null))];
  answers[i] = v;
  return { ...value, answers };
}

/* ---------- Core ---------- */

function GrammarMC3({ q, value, onChange }: P) {
  const choices = (q.options?.choices as string[]) ?? [];
  return (
    <div className="space-y-2">
      {choices.map((c, i) => (
        <Radio
          key={i}
          name={q.id}
          checked={value.choice === i}
          onSelect={() => onChange({ ...value, choice: i })}
        >
          {c}
        </Radio>
      ))}
    </div>
  );
}

function VocabSet({ q, value, onChange }: P) {
  const bank = (q.options?.bank as string[]) ?? [];
  const items = (q.options?.items as { text: string }[]) ?? [];
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-4">
          <span className="text-[15px] w-40">{item.text}</span>
          <select
            className={selectCls}
            value={(value.answers?.[i] as string) ?? ""}
            onChange={(e) =>
              onChange(setAnswerAt(value, i, e.target.value || null, items.length))
            }
          >
            <option value="">— choose —</option>
            {bank.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

/* ---------- Reading ---------- */

/** Renders a passage whose [[n]] gaps become inline dropdowns. */
function GapPassage({
  passage,
  gapOptions,
  value,
  onChange,
  gapCount,
}: {
  passage: string;
  gapOptions: (i: number) => string[];
  value: Answer;
  onChange: (a: Answer) => void;
  gapCount: number;
}) {
  const parts = passage.split(/\[\[(\d+)\]\]/g);
  return (
    <p className="text-[15px] leading-8 whitespace-pre-wrap">
      {parts.map((part, idx) => {
        if (idx % 2 === 0) return <span key={idx}>{part}</span>;
        const gapIndex = Number(part) - 1;
        return (
          <select
            key={idx}
            className={`${selectCls} mx-1`}
            value={(value.answers?.[gapIndex] as string) ?? ""}
            onChange={(e) =>
              onChange(setAnswerAt(value, gapIndex, e.target.value || null, gapCount))
            }
          >
            <option value="">({gapIndex + 1}) …</option>
            {gapOptions(gapIndex).map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        );
      })}
    </p>
  );
}

function R1GapMC3({ q, value, onChange }: P) {
  const gaps = (q.options?.gaps as { choices: string[] }[]) ?? [];
  return (
    <GapPassage
      passage={q.passage ?? ""}
      gapOptions={(i) => gaps[i]?.choices ?? []}
      value={value}
      onChange={onChange}
      gapCount={gaps.length}
    />
  );
}

function R4BankedCloze({ q, value, onChange }: P) {
  const bank = (q.options?.bank as string[]) ?? [];
  const gapCount = ((q.passage ?? "").match(/\[\[\d+\]\]/g) ?? []).length;
  return (
    <GapPassage
      passage={q.passage ?? ""}
      gapOptions={() => bank}
      value={value}
      onChange={onChange}
      gapCount={gapCount}
    />
  );
}

function R2Ordering({ q, value, onChange }: P) {
  const sentences = (q.options?.sentences as string[]) ?? [];
  const order = value.order ?? sentences.map((_, i) => i);

  function move(pos: number, dir: -1 | 1) {
    const next = [...order];
    const swap = pos + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[pos], next[swap]] = [next[swap], next[pos]];
    onChange({ ...value, order: next });
  }

  return (
    <div className="space-y-2">
      <div className="rounded-md border border-line bg-cream-50 px-3 py-2.5 text-[15px]">
        <span className="label-caps mr-2">First</span>
        {q.options?.fixed_first as string}
      </div>
      {order.map((sentenceIdx, pos) => (
        <div
          key={sentenceIdx}
          className="flex items-center gap-2 rounded-md border border-line bg-paper px-3 py-2.5"
        >
          <span className="figures text-[12px] text-ink-muted w-5">{pos + 2}</span>
          <span className="flex-1 text-[15px]">{sentences[sentenceIdx]}</span>
          <button
            type="button"
            onClick={() => move(pos, -1)}
            disabled={pos === 0}
            className="text-ink-muted hover:text-ink disabled:opacity-30 px-1.5 cursor-pointer"
            aria-label="Move up"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => move(pos, 1)}
            disabled={pos === order.length - 1}
            className="text-ink-muted hover:text-ink disabled:opacity-30 px-1.5 cursor-pointer"
            aria-label="Move down"
          >
            ↓
          </button>
        </div>
      ))}
    </div>
  );
}

function R3OpinionMatch({ q, value, onChange }: P) {
  const people = (q.options?.people as { name: string; text: string }[]) ?? [];
  const questions = (q.options?.questions as string[]) ?? [];
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {people.map((p) => (
          <div key={p.name} className="rounded-card border border-line bg-cream-50 p-4">
            <p className="label-caps mb-1">{p.name}</p>
            <p className="text-[14px]">{p.text}</p>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {questions.map((question, i) => (
          <div key={i} className="flex flex-wrap items-center gap-3">
            <span className="text-[15px] flex-1 min-w-52">
              <span className="figures text-ink-muted mr-2">{i + 1}.</span>
              {question}
            </span>
            <select
              className={selectCls}
              value={value.answers?.[i] != null ? String(value.answers[i]) : ""}
              onChange={(e) =>
                onChange(
                  setAnswerAt(
                    value,
                    i,
                    e.target.value === "" ? null : Number(e.target.value),
                    questions.length
                  )
                )
              }
            >
              <option value="">— choose —</option>
              {people.map((p, pi) => (
                <option key={pi} value={pi}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

function R5HeadingMatch({ q, value, onChange }: P) {
  const paragraphs = (q.options?.paragraphs as string[]) ?? [];
  const headings = (q.options?.headings as string[]) ?? [];
  return (
    <div className="space-y-5">
      {paragraphs.map((para, i) => (
        <div key={i} className="rounded-card border border-line bg-paper p-4 space-y-3">
          <select
            className={`${selectCls} w-full max-w-md`}
            value={value.answers?.[i] != null ? String(value.answers[i]) : ""}
            onChange={(e) =>
              onChange(
                setAnswerAt(
                  value,
                  i,
                  e.target.value === "" ? null : Number(e.target.value),
                  paragraphs.length
                )
              )
            }
          >
            <option value="">— choose a heading for paragraph {i + 1} —</option>
            {headings.map((h, hi) => (
              <option key={hi} value={hi}>
                {h}
              </option>
            ))}
          </select>
          <p className="text-[14px] leading-6">{para}</p>
        </div>
      ))}
    </div>
  );
}

/* ---------- Listening ---------- */

function withAudio(q: StudentQuestion, value: Answer, onChange: (a: Answer) => void, body: ReactNode) {
  return (
    <div className="space-y-5">
      {q.signedMediaUrl ? (
        <AudioPlayer
          src={q.signedMediaUrl}
          plays={value._plays ?? 0}
          onPlay={() => onChange({ ...value, _plays: (value._plays ?? 0) + 1 })}
        />
      ) : (
        <p className="rounded-md bg-alert-bg text-alert px-3 py-2 text-[13px]">
          Audio file missing — tell your teacher.
        </p>
      )}
      {body}
    </div>
  );
}

function L1MC4({ q, value, onChange }: P) {
  const choices = (q.options?.choices as string[]) ?? [];
  return withAudio(
    q,
    value,
    onChange,
    <div className="space-y-2">
      {choices.map((c, i) => (
        <Radio
          key={i}
          name={q.id}
          checked={value.choice === i}
          onSelect={() => onChange({ ...value, choice: i })}
        >
          {c}
        </Radio>
      ))}
    </div>
  );
}

function L2SpeakerMatch({ q, value, onChange }: P) {
  const statements = (q.options?.statements as string[]) ?? [];
  const speakers = ["Speaker A", "Speaker B", "Speaker C", "Speaker D"];
  return withAudio(
    q,
    value,
    onChange,
    <div className="space-y-3">
      {statements.map((s, i) => (
        <div key={i} className="flex flex-wrap items-center gap-3">
          <span className="text-[15px] flex-1 min-w-52">{s}</span>
          <select
            className={selectCls}
            value={value.answers?.[i] != null ? String(value.answers[i]) : ""}
            onChange={(e) =>
              onChange(
                setAnswerAt(
                  value,
                  i,
                  e.target.value === "" ? null : Number(e.target.value),
                  statements.length
                )
              )
            }
          >
            <option value="">— choose —</option>
            {speakers.map((sp, si) => (
              <option key={si} value={si}>
                {sp}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

function L3OpinionId({ q, value, onChange }: P) {
  const statements = (q.options?.statements as string[]) ?? [];
  const choices = ["man", "woman", "both"];
  return withAudio(
    q,
    value,
    onChange,
    <div className="space-y-4">
      {statements.map((s, i) => (
        <div key={i}>
          <p className="text-[15px] mb-1.5">{s}</p>
          <div className="flex gap-2">
            {choices.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onChange(setAnswerAt(value, i, c, statements.length))}
                className={`rounded-md border px-3 py-1.5 text-[13px] capitalize cursor-pointer ${
                  value.answers?.[i] === c
                    ? "border-crimson bg-crimson-bg text-crimson"
                    : "border-line bg-paper hover:bg-cream-50"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function L4MonologueMC({ q, value, onChange }: P) {
  const questions = (q.options?.questions as { text: string; choices: string[] }[]) ?? [];
  return withAudio(
    q,
    value,
    onChange,
    <div className="space-y-6">
      {questions.map((sub, i) => (
        <div key={i}>
          <p className="text-[15px] mb-2">
            <span className="figures text-ink-muted mr-2">{i + 1}.</span>
            {sub.text}
          </p>
          <div className="space-y-2">
            {sub.choices.map((c, ci) => (
              <Radio
                key={ci}
                name={`${q.id}-${i}`}
                checked={value.answers?.[i] === ci}
                onSelect={() => onChange(setAnswerAt(value, i, ci, questions.length))}
              >
                {c}
              </Radio>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- dispatch ---------- */

const speaking = (p: P) => (
  <SpeakingTask q={p.q} value={p.value} onChange={p.onChange} ctx={p.ctx} />
);

const RENDERERS: Record<string, (p: P) => ReactNode> = {
  grammar_mc3: GrammarMC3,
  vocab_set: VocabSet,
  r1_gap_mc3: R1GapMC3,
  r2_ordering: R2Ordering,
  r3_opinion_match: R3OpinionMatch,
  r4_banked_cloze: R4BankedCloze,
  r5_heading_match: R5HeadingMatch,
  l1_mc4: L1MC4,
  l2_speaker_match: L2SpeakerMatch,
  l3_opinion_id: L3OpinionId,
  l4_monologue_mc: L4MonologueMC,
  w1_form: W1Form,
  w2_short: W2Short,
  w3_chat: W3Chat,
  w4_email: W4Email,
  s1_personal: speaking,
  s2_photo: speaking,
  s3_compare: speaking,
  s4_abstract: speaking,
};

export function QuestionRenderer(props: P) {
  const R = RENDERERS[props.q.question_type];
  if (!R) {
    return (
      <p className="rounded-md bg-pending-bg text-pending px-3 py-2 text-[13px]">
        This question type ({props.q.question_type}) is not available yet.
      </p>
    );
  }
  return <>{R(props)}</>;
}
