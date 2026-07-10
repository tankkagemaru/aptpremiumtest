"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { QuestionRenderer } from "./renderers";
import { MicCheck } from "./speaking-task";
import { answerWordCount, type Answer, type StudentQuestion } from "./types";

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function TestRunner({
  attemptId,
  studentId,
  sectionModule,
  sectionTitle,
  deadline,
  questions,
  initialAnswers,
  submitAction,
}: {
  attemptId: string;
  studentId: string;
  sectionModule: string;
  sectionTitle: string;
  deadline: string; // ISO
  questions: StudentQuestion[];
  initialAnswers: Record<string, Answer>;
  submitAction: () => Promise<void>;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [answers, setAnswers] = useState<Record<string, Answer>>(initialAnswers);
  const [current, setCurrent] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000))
  );
  const [submitting, setSubmitting] = useState(false);
  const [micPassed, setMicPassed] = useState(sectionModule !== "speaking");
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const pending = useRef(new Map<string, Answer>());
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submittedRef = useRef(false);

  const flush = useCallback(async () => {
    if (pending.current.size === 0) return;
    const batch = Array.from(pending.current.entries());
    pending.current.clear();
    setSaveState("saving");
    const rows = batch.map(([questionId, answer]) => ({
      attempt_id: attemptId,
      question_id: questionId,
      answer,
      word_count: answerWordCount(answer) || null,
      answered_at: new Date().toISOString(),
    }));
    const { error } = await supabase
      .from("mock_responses")
      .upsert(rows, { onConflict: "attempt_id,question_id" });
    if (error) {
      // put failed saves back so the next flush retries them
      batch.forEach(([qid, a]) => {
        if (!pending.current.has(qid)) pending.current.set(qid, a);
      });
      setSaveState("error");
    } else {
      setSaveState(pending.current.size > 0 ? "saving" : "saved");
    }
  }, [attemptId, supabase]);

  const handleChange = useCallback(
    (questionId: string, answer: Answer) => {
      setAnswers((prev) => ({ ...prev, [questionId]: answer }));
      pending.current.set(questionId, answer);
      setSaveState("saving");
      if (flushTimer.current) clearTimeout(flushTimer.current);
      flushTimer.current = setTimeout(flush, 800);
    },
    [flush]
  );

  const doSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    if (flushTimer.current) clearTimeout(flushTimer.current);
    await flush();
    await submitAction();
  }, [flush, submitAction]);

  // countdown + auto-submit
  useEffect(() => {
    const t = setInterval(() => {
      const left = Math.max(
        0,
        Math.floor((new Date(deadline).getTime() - Date.now()) / 1000)
      );
      setSecondsLeft(left);
      if (left <= 0) {
        clearInterval(t);
        doSubmit();
      }
    }, 1000);
    return () => clearInterval(t);
  }, [deadline, doSubmit]);

  const isAnswered = (q: StudentQuestion) => {
    const a = answers[q.id];
    if (!a) return false;
    if (a.choice !== undefined) return true;
    if (a.order) return true;
    if (a.text?.trim()) return true;
    if ((a.texts ?? []).some((t) => t?.trim())) return true;
    if ((a.audio_paths ?? []).length > 0) return true;
    return (a.answers ?? []).some((x) => x !== null && x !== undefined && x !== "");
  };

  const q = questions[current];
  const answeredCount = questions.filter(isAnswered).length;
  const low = secondsLeft <= 300;

  if (!micPassed) {
    return <MicCheck onPassed={() => setMicPassed(true)} />;
  }

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-line bg-cream-50 sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between gap-4">
          <div>
            <p className="label-caps">{sectionTitle}</p>
            <p className="figures text-[12px] text-ink-muted">
              {answeredCount}/{questions.length} answered ·{" "}
              {saveState === "saved" ? "saved" : saveState === "saving" ? "saving…" : "offline — retrying"}
            </p>
          </div>
          <p
            className={`figures text-2xl ${low ? "text-crimson" : "text-ink"}`}
            aria-live={low ? "polite" : "off"}
          >
            {formatTime(secondsLeft)}
          </p>
        </div>
      </header>

      <div className="flex-1 mx-auto w-full max-w-4xl px-4 py-6 grid gap-6 lg:grid-cols-[1fr_180px]">
        <main>
          <div className="mb-4">
            <p className="label-caps mb-1">
              Question {current + 1} of {questions.length}
            </p>
            {q.prompt ? <h2 className="text-lg font-sans font-medium">{q.prompt}</h2> : null}
            {q.passage && !q.question_type.startsWith("l") && !q.passage.includes("[[") ? (
              <p className="mt-3 text-[15px] leading-7 whitespace-pre-wrap rounded-card border border-line bg-cream-50 p-4">
                {q.passage}
              </p>
            ) : null}
          </div>

          <QuestionRenderer
            q={q}
            value={answers[q.id] ?? {}}
            onChange={(a) => handleChange(q.id, a)}
            ctx={{ attemptId, studentId }}
          />

          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="secondary"
              onClick={() => setCurrent((c) => Math.max(0, c - 1))}
              disabled={current === 0 || submitting}
            >
              ← Previous
            </Button>
            {current < questions.length - 1 ? (
              <Button onClick={() => setCurrent((c) => c + 1)} disabled={submitting}>
                Next →
              </Button>
            ) : (
              <Button
                onClick={() => {
                  if (
                    answeredCount < questions.length &&
                    !confirm(
                      `You have answered ${answeredCount} of ${questions.length} questions. Submit this section anyway? You cannot return to it.`
                    )
                  )
                    return;
                  doSubmit();
                }}
                disabled={submitting}
              >
                {submitting ? "Submitting…" : "Submit section"}
              </Button>
            )}
          </div>
        </main>

        <aside className="lg:sticky lg:top-20 self-start">
          <p className="label-caps mb-2">Questions</p>
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((qq, i) => (
              <button
                key={qq.id}
                type="button"
                onClick={() => setCurrent(i)}
                className={`figures h-9 rounded-md border text-[13px] cursor-pointer transition-colors ${
                  i === current
                    ? "border-crimson bg-crimson text-paper"
                    : isAnswered(qq)
                      ? "border-line bg-good-bg text-good"
                      : "border-line bg-paper text-ink-soft hover:bg-cream-50"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
