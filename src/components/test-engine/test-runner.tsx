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
  sectionIndex,
  totalSections,
  deadline,
  questions,
  initialAnswers,
  submitAction,
}: {
  attemptId: string;
  studentId: string;
  sectionModule: string;
  sectionTitle: string;
  sectionIndex?: number;
  totalSections?: number;
  deadline: string; // ISO
  questions: StudentQuestion[];
  initialAnswers: Record<string, Answer>;
  submitAction: () => Promise<void>;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [answers, setAnswers] = useState<Record<string, Answer>>(initialAnswers);
  const [current, setCurrent] = useState(0);
  const [reviewing, setReviewing] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000))
  );
  const [submitting, setSubmitting] = useState(false);
  const [micPassed, setMicPassed] = useState(sectionModule !== "speaking");
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved");
  const pending = useRef(new Map<string, Answer>());
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);
  const flushRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const submittedRef = useRef(false);

  const flush = useCallback(async () => {
    // Serialize: never let two save passes interleave (avoids a submit racing
    // ahead of an in-flight save and grading a stale answer).
    if (inFlight.current) {
      try {
        await inFlight.current;
      } catch {
        /* previous pass already handled its own error */
      }
    }
    if (pending.current.size === 0) return;

    const run = (async () => {
      const batch = Array.from(pending.current.entries());
      pending.current.clear();
      setSaveState("saving");
      // Each answer is saved via a definer RPC (enforces ownership, blocks score columns).
      const results = await Promise.all(
        batch.map(([questionId, answer]) =>
          supabase.rpc("mock_save_response", {
            p_attempt: attemptId,
            p_question: questionId,
            p_answer: answer,
            p_word_count: answerWordCount(answer) || null,
          })
        )
      );
      const failed = batch.filter((_, i) => results[i].error);
      if (failed.length > 0) {
        // put failed saves back so they retry
        failed.forEach(([qid, a]) => {
          if (!pending.current.has(qid)) pending.current.set(qid, a);
        });
        setSaveState("error");
        // auto-retry even if the student stops typing
        if (flushTimer.current) clearTimeout(flushTimer.current);
        flushTimer.current = setTimeout(() => {
          void flushRef.current();
        }, 2000);
      } else {
        setSaveState(pending.current.size > 0 ? "saving" : "saved");
      }
    })();
    inFlight.current = run;
    try {
      await run;
    } finally {
      if (inFlight.current === run) inFlight.current = null;
    }
  }, [attemptId, supabase]);

  // Always call the latest flush from timers/listeners.
  flushRef.current = flush;

  const handleChange = useCallback(
    (questionId: string, answer: Answer) => {
      setAnswers((prev) => ({ ...prev, [questionId]: answer }));
      pending.current.set(questionId, answer);
      setSaveState("saving");
      if (flushTimer.current) clearTimeout(flushTimer.current);
      flushTimer.current = setTimeout(() => void flushRef.current(), 800);
    },
    []
  );

  // Save immediately when a text field loses focus (covers fast typists who
  // move to the next question or submit before the 800ms debounce fires).
  const handleBlur = useCallback(() => {
    if (pending.current.size === 0) return;
    if (flushTimer.current) clearTimeout(flushTimer.current);
    void flushRef.current();
  }, []);

  const doSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    if (flushTimer.current) clearTimeout(flushTimer.current);
    await flush(); // waits for any in-flight pass, then saves what's left
    await submitAction();
  }, [flush, submitAction]);

  // Best-effort save if the tab is hidden or the student navigates away.
  useEffect(() => {
    const onHide = () => {
      if (pending.current.size > 0) void flushRef.current();
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onHide);
    };
  }, []);

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
            <p className="label-caps">
              {totalSections ? (
                <span className="text-ink-muted mr-2">
                  Section {(sectionIndex ?? 0) + 1} of {totalSections}
                </span>
              ) : null}
              {sectionTitle}
            </p>
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
        <main onBlur={handleBlur}>
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
              <Button onClick={() => setReviewing(true)} disabled={submitting}>
                {submitting ? "Submitting…" : "Review & submit"}
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

      {reviewing ? (
        <div className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-card border border-line bg-paper shadow-lg p-6 space-y-4">
            <div>
              <p className="label-caps mb-1">Before you submit</p>
              <p className="text-[15px]">
                You&apos;ve answered{" "}
                <span className="figures">{answeredCount}</span> of{" "}
                <span className="figures">{questions.length}</span> questions.
              </p>
            </div>

            {answeredCount < questions.length ? (
              <div>
                <p className="text-[13px] text-ink-muted mb-2">Unanswered — tap to jump:</p>
                <div className="flex flex-wrap gap-1.5">
                  {questions.map((qq, i) =>
                    isAnswered(qq) ? null : (
                      <button
                        key={qq.id}
                        type="button"
                        onClick={() => {
                          setCurrent(i);
                          setReviewing(false);
                        }}
                        className="figures h-8 w-8 rounded-md border border-pending bg-pending-bg text-pending text-[13px] cursor-pointer"
                      >
                        {i + 1}
                      </button>
                    )
                  )}
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-good">All questions answered.</p>
            )}

            <p className="text-[12px] text-ink-muted">
              You cannot return to this section once submitted.
            </p>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setReviewing(false)} disabled={submitting}>
                Keep working
              </Button>
              <Button onClick={doSubmit} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit section"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
