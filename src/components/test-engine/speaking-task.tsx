"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import type { Answer, RunnerCtx, StudentQuestion } from "./types";

function pickMimeType() {
  if (typeof MediaRecorder === "undefined") return "";
  for (const t of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"]) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}

/** One-time microphone check before a speaking section. */
export function MicCheck({ onPassed }: { onPassed: () => void }) {
  const [stage, setStage] = useState<"idle" | "recording" | "playback" | "error">("idle");
  const [url, setUrl] = useState<string | null>(null);

  async function test() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream, { mimeType: pickMimeType() || undefined });
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        setUrl(URL.createObjectURL(new Blob(chunks, { type: rec.mimeType })));
        setStage("playback");
      };
      rec.start();
      setStage("recording");
      setTimeout(() => rec.state !== "inactive" && rec.stop(), 3000);
    } catch {
      setStage("error");
    }
  }

  return (
    <div className="mx-auto max-w-md py-16 text-center space-y-5">
      <p className="label-caps">Microphone check</p>
      <h2 className="text-xl">Before you begin</h2>
      <p className="text-[14px] text-ink-soft">
        Your answers in this section are recorded. Say a few words to check your
        microphone — recording lasts 3 seconds.
      </p>
      {stage === "error" ? (
        <p className="rounded-md bg-alert-bg text-alert px-3 py-2 text-[13px]">
          Microphone access was blocked. Allow microphone access in your browser
          and try again.
        </p>
      ) : null}
      {stage === "playback" && url ? (
        <div className="space-y-4">
          <audio src={url} controls className="mx-auto" />
          <div className="flex justify-center gap-3">
            <Button variant="secondary" onClick={test}>
              Test again
            </Button>
            <Button onClick={onPassed}>I can hear myself — start</Button>
          </div>
        </div>
      ) : (
        <Button onClick={test} disabled={stage === "recording"}>
          {stage === "recording" ? "Recording… speak now" : "Test microphone"}
        </Button>
      )}
    </div>
  );
}

type Phase = "intro" | "prep" | "recording" | "uploading" | "between" | "done" | "error";

/** Staged APTIS speaking task: per sub-question timed recording, auto-stop,
 *  upload to mock-speaking. No re-records, like the real test. */
export function SpeakingTask({
  q,
  value,
  onChange,
  ctx,
}: {
  q: StudentQuestion;
  value: Answer;
  onChange: (a: Answer) => void;
  ctx: RunnerCtx;
}) {
  const supabase = useRef(createClient()).current;
  const questions = (q.options?.questions as string[]) ?? [];
  const responseSeconds = (q.options?.response_seconds as number) ?? 45;
  const prepSeconds = (q.options?.prep_seconds as number) ?? 0;
  // s4 answers all questions in ONE recording; others record per question
  const singleTurn = q.question_type === "s4_abstract";
  const totalRecordings = singleTurn ? 1 : questions.length;

  const donePaths = value.audio_paths ?? [];
  const [phase, setPhase] = useState<Phase>(donePaths.length >= totalRecordings ? "done" : "intro");
  const [sub, setSub] = useState(donePaths.length);
  const [countdown, setCountdown] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const recRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const images: string[] =
    q.question_type === "s3_compare"
      ? ((q.options?.signed_images as string[]) ?? [])
      : q.signedMediaUrl
        ? [q.signedMediaUrl]
        : [];

  function runCountdown(seconds: number, onDone: () => void) {
    setCountdown(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current!);
          onDone();
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  async function record(subIdx: number) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream, { mimeType: pickMimeType() || undefined });
      recRef.current = rec;
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setPhase("uploading");
        const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        const path = `${ctx.studentId}/${ctx.attemptId}/${q.id}-${subIdx}.webm`;
        const { error } = await supabase.storage
          .from("mock-speaking")
          .upload(path, blob, { contentType: blob.type, upsert: false });
        if (error && !/already exists/i.test(error.message)) {
          setErrorMsg(`Upload failed: ${error.message}. Check your connection.`);
          setPhase("error");
          return;
        }
        const paths = [...(value.audio_paths ?? []), path];
        onChange({ ...value, audio_paths: paths });
        if (paths.length >= totalRecordings) {
          setPhase("done");
        } else {
          setSub(paths.length);
          setPhase("between");
        }
      };
      rec.start();
      setPhase("recording");
      runCountdown(singleTurn ? responseSeconds : responseSeconds, () => {
        if (rec.state !== "inactive") rec.stop();
      });
    } catch {
      setErrorMsg("Microphone access failed. Allow the microphone and try again.");
      setPhase("error");
    }
  }

  function begin() {
    if (prepSeconds > 0) {
      setPhase("prep");
      runCountdown(prepSeconds, () => record(sub));
    } else {
      record(sub);
    }
  }

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (recRef.current && recRef.current.state !== "inactive") recRef.current.stop();
  }, []);

  const activeQuestionText = singleTurn ? null : questions[sub];

  return (
    <div className="space-y-5">
      {images.length > 0 ? (
        <div className={`grid gap-3 ${images.length > 1 ? "sm:grid-cols-2" : ""}`}>
          {images.map((src) => (
            <Image
              key={src}
              src={src}
              alt="Speaking prompt"
              width={640}
              height={420}
              unoptimized
              className="rounded-card border border-line w-full h-auto"
            />
          ))}
        </div>
      ) : null}

      <ol className="space-y-1.5">
        {questions.map((question, i) => (
          <li
            key={i}
            className={`text-[15px] ${
              !singleTurn && i === sub && phase !== "done" ? "text-ink" : "text-ink-soft"
            }`}
          >
            <span className="figures text-ink-muted mr-2">{i + 1}.</span>
            {question}
            {!singleTurn && i < donePaths.length ? (
              <span className="ml-2 rounded bg-good-bg text-good px-1.5 py-0.5 text-[11px]">
                recorded
              </span>
            ) : null}
          </li>
        ))}
      </ol>

      <div className="rounded-card border border-line bg-cream-50 p-5 text-center space-y-3">
        {phase === "intro" ? (
          <>
            <p className="text-[14px] text-ink-soft">
              {singleTurn
                ? `You have ${prepSeconds ? `${prepSeconds} seconds to prepare, then ` : ""}${Math.round(responseSeconds / 60)} minutes to talk about all three questions in one turn.`
                : `You will answer ${questions.length} questions. Each answer records for ${responseSeconds} seconds and stops automatically. You cannot re-record.`}
            </p>
            <Button onClick={begin}>
              {prepSeconds > 0 ? "Start preparation" : "Start answering"}
            </Button>
          </>
        ) : null}

        {phase === "prep" ? (
          <>
            <p className="label-caps">Preparation time</p>
            <p className="figures text-3xl">{countdown}s</p>
            <Button
              variant="secondary"
              onClick={() => {
                if (timerRef.current) clearInterval(timerRef.current);
                record(sub);
              }}
            >
              Start speaking now
            </Button>
          </>
        ) : null}

        {phase === "recording" ? (
          <>
            <p className="label-caps text-crimson">● Recording</p>
            {activeQuestionText ? (
              <p className="text-[15px] font-medium">{activeQuestionText}</p>
            ) : null}
            <p className="figures text-3xl">{countdown}s</p>
            <Button
              variant="secondary"
              onClick={() => {
                if (timerRef.current) clearInterval(timerRef.current);
                recRef.current?.state !== "inactive" && recRef.current?.stop();
              }}
            >
              Finish early
            </Button>
          </>
        ) : null}

        {phase === "uploading" ? (
          <p className="text-[14px] text-ink-muted">Saving your recording…</p>
        ) : null}

        {phase === "between" ? (
          <>
            <p className="text-[14px] text-ink-soft">
              Saved. Ready for question {sub + 1}?
            </p>
            <Button onClick={() => record(sub)}>Answer question {sub + 1}</Button>
          </>
        ) : null}

        {phase === "done" ? (
          <p className="text-[14px] text-good">
            ✓ All recordings saved for this task. Use <em>Next</em> to continue.
          </p>
        ) : null}

        {phase === "error" ? (
          <>
            <p className="rounded-md bg-alert-bg text-alert px-3 py-2 text-[13px]">{errorMsg}</p>
            <Button variant="secondary" onClick={() => record(sub)}>
              Try again
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
