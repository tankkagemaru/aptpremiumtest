import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isAiConfigured } from "@/lib/ai/writing";
import { MODULE_LABEL } from "@/lib/scoring/cefr";
import { runAiWriting, saveGrade, verifyAndRelease } from "../actions";

type Grade = {
  module: string;
  ai_score: number | null;
  ai_feedback: {
    rubric?: Record<string, number>;
    summary?: string;
    per_task?: { part: number; note: string }[];
    cefr?: string;
  } | null;
  ai_model: string | null;
  teacher_score: number | null;
  teacher_feedback: string | null;
  status: string;
};

function writingText(answer: { text?: string; texts?: string[] } | null): string {
  if (!answer) return "";
  if (answer.text !== undefined) return answer.text;
  if (answer.texts) return answer.texts.filter(Boolean).join("\n\n");
  return "";
}

export default async function GradingWorkspace({
  params,
  searchParams,
}: {
  params: Promise<{ attemptId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { attemptId } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();

  const { data: attempt } = await supabase
    .from("mock_attempts")
    .select("id, test_id, status, student:students(full_name, email), test:mock_tests(title)")
    .eq("id", attemptId)
    .maybeSingle();
  if (!attempt) notFound();

  // Which manual modules does this test contain?
  const { data: ordered } = await supabase.rpc("mock_ordered_sections", {
    p_test: attempt.test_id,
  });
  const manualModules = Array.from(
    new Set(
      ((ordered ?? []) as { module: string }[])
        .map((s) => s.module)
        .filter((m) => m === "writing" || m === "speaking")
    )
  );

  const { data: responses } = await supabase
    .from("mock_responses")
    .select("question_id, answer, audio_path, word_count, question:mock_questions(part, prompt, module, question_type, options)")
    .eq("attempt_id", attemptId);

  const { data: gradesRaw } = await supabase
    .from("mock_grades")
    .select("module, ai_score, ai_feedback, ai_model, teacher_score, teacher_feedback, status")
    .eq("attempt_id", attemptId);
  const grades = new Map<string, Grade>(
    (gradesRaw ?? []).map((g) => [g.module, g as Grade])
  );

  const writingResponses = (responses ?? [])
    .filter((r) => (r.question as unknown as { module: string } | null)?.module === "writing")
    .sort(
      (a, b) =>
        ((a.question as unknown as { part: number }).part ?? 0) -
        ((b.question as unknown as { part: number }).part ?? 0)
    );

  const speakingResponses = (responses ?? []).filter(
    (r) => (r.question as unknown as { module: string } | null)?.module === "speaking"
  );

  // Sign speaking audio for playback
  const audioByQuestion = new Map<string, { paths: string[]; urls: string[] }>();
  for (const r of speakingResponses) {
    const paths = ((r.answer as { audio_paths?: string[] } | null)?.audio_paths ?? []).filter(
      Boolean
    );
    const urls: string[] = [];
    for (const p of paths) {
      const { data } = await supabase.storage.from("mock-speaking").createSignedUrl(p, 60 * 60);
      if (data?.signedUrl) urls.push(data.signedUrl);
    }
    audioByQuestion.set(r.question_id, { paths, urls });
  }

  const allManualGraded = manualModules.every((m) => grades.get(m)?.teacher_score != null);
  const student = attempt.student as unknown as { full_name: string; email: string } | null;
  const test = attempt.test as unknown as { title: string } | null;

  return (
    <div className="space-y-8">
      <div>
        <p className="label-caps mb-2">
          <Link href="/dashboard/grading" className="hover:text-crimson">
            05 · Grading
          </Link>{" "}
          / {student?.full_name}
        </p>
        <h1 className="text-2xl">{student?.full_name}</h1>
        <p className="text-[13px] text-ink-muted">
          {test?.title} · {student?.email}
        </p>
      </div>

      {error ? (
        <p className="rounded-md bg-alert-bg text-alert px-3 py-2 text-[13px]">{error}</p>
      ) : null}

      {manualModules.length === 0 ? (
        <Card className="p-6">
          <p className="text-[14px] text-ink-soft">
            This test has no writing or speaking sections — all modules are
            auto-scored. Verify and release below.
          </p>
        </Card>
      ) : null}

      {/* WRITING */}
      {manualModules.includes("writing") ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl">Writing</h2>
            <form action={runAiWriting}>
              <input type="hidden" name="attempt_id" value={attemptId} />
              <Button variant="secondary" type="submit" disabled={!isAiConfigured()}>
                {grades.get("writing")?.ai_score != null ? "Re-run AI" : "Get AI suggestion"}
              </Button>
            </form>
          </div>
          {!isAiConfigured() ? (
            <p className="text-[12px] text-ink-muted">
              AI suggestions are off (no OPENAI_API_KEY set) — grade manually below.
            </p>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5 space-y-4">
              <p className="label-caps">Student response</p>
              {writingResponses.map((r) => {
                const q = r.question as unknown as { part: number; prompt: string };
                return (
                  <div key={r.question_id}>
                    <p className="text-[13px] text-ink-muted mb-1">
                      Part {q.part} · {r.word_count ?? 0} words
                    </p>
                    <p className="text-[14px] whitespace-pre-wrap leading-6 border-l-2 border-line pl-3">
                      {writingText(r.answer as { text?: string; texts?: string[] }) || "(no answer)"}
                    </p>
                  </div>
                );
              })}
            </Card>

            <div className="space-y-4">
              <AiSuggestion grade={grades.get("writing")} />
              <GradeForm
                attemptId={attemptId}
                module="writing"
                grade={grades.get("writing")}
              />
            </div>
          </div>
        </section>
      ) : null}

      {/* SPEAKING */}
      {manualModules.includes("speaking") ? (
        <section className="space-y-4">
          <h2 className="text-xl">Speaking</h2>
          <Card className="p-5 space-y-5">
            <p className="label-caps">Recordings</p>
            {speakingResponses.length === 0 ? (
              <p className="text-[14px] text-ink-muted">No recordings submitted.</p>
            ) : (
              speakingResponses
                .sort(
                  (a, b) =>
                    ((a.question as unknown as { part: number }).part ?? 0) -
                    ((b.question as unknown as { part: number }).part ?? 0)
                )
                .map((r) => {
                  const q = r.question as unknown as {
                    part: number;
                    prompt: string;
                    options: { questions?: string[] } | null;
                  };
                  const audio = audioByQuestion.get(r.question_id);
                  return (
                    <div key={r.question_id} className="space-y-2">
                      <p className="text-[14px] font-medium">Part {q.part} — {q.prompt}</p>
                      {(audio?.urls ?? []).length === 0 ? (
                        <p className="text-[13px] text-ink-muted">No audio.</p>
                      ) : (
                        (audio?.urls ?? []).map((url, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="figures text-[12px] text-ink-muted w-5">
                              {i + 1}
                            </span>
                            <audio src={url} controls className="w-full max-w-md" />
                          </div>
                        ))
                      )}
                    </div>
                  );
                })
            )}
          </Card>
          <GradeForm attemptId={attemptId} module="speaking" grade={grades.get("speaking")} />
        </section>
      ) : null}

      {/* VERIFY & RELEASE */}
      <section>
        <h2 className="text-xl mb-3">Verify &amp; release</h2>
        <Card className="p-5">
          {!allManualGraded ? (
            <p className="text-[14px] text-pending">
              Grade all manual modules above before releasing.
            </p>
          ) : (
            <form action={verifyAndRelease} className="space-y-4">
              <input type="hidden" name="attempt_id" value={attemptId} />
              <div>
                <label htmlFor="teacher_comment" className="label-caps block mb-1.5">
                  Comment to student (optional)
                </label>
                <textarea
                  id="teacher_comment"
                  name="teacher_comment"
                  rows={3}
                  className="w-full rounded-md border border-line bg-paper px-3 py-2 text-[15px] focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson"
                />
              </div>
              <p className="text-[13px] text-ink-muted">
                This computes final scale scores and CEFR levels for every module,
                then releases the result to the student.
              </p>
              <Button type="submit">Verify &amp; release result</Button>
            </form>
          )}
        </Card>
      </section>
    </div>
  );
}

function AiSuggestion({ grade }: { grade?: Grade }) {
  if (!grade?.ai_feedback) return null;
  const fb = grade.ai_feedback;
  const rubric = fb.rubric ?? {};
  return (
    <Card className="p-5 space-y-3 border-gold">
      <div className="flex items-center justify-between">
        <p className="label-caps">AI suggestion</p>
        <span className="figures text-[13px] text-ink-muted">{grade.ai_model}</span>
      </div>
      <div className="flex items-baseline gap-3">
        <span className="figures text-3xl font-display">{grade.ai_score}</span>
        <span className="text-ink-muted text-[13px]">/ 50 · {fb.cefr}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[13px]">
        {Object.entries(rubric).map(([k, v]) => (
          <div key={k} className="flex justify-between border border-line rounded px-2 py-1">
            <span className="capitalize text-ink-soft">{k.replace(/_/g, " ")}</span>
            <span className="figures">{v}/5</span>
          </div>
        ))}
      </div>
      {fb.summary ? <p className="text-[13px] leading-6">{fb.summary}</p> : null}
      {(fb.per_task ?? []).length > 0 ? (
        <ul className="space-y-1 text-[13px]">
          {fb.per_task!.map((t) => (
            <li key={t.part}>
              <span className="text-ink-muted">Part {t.part}:</span> {t.note}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="text-[12px] text-ink-muted">
        A suggestion only — set the final score below.
      </p>
    </Card>
  );
}

function GradeForm({
  attemptId,
  module,
  grade,
}: {
  attemptId: string;
  module: string;
  grade?: Grade;
}) {
  return (
    <Card className="p-5">
      <form action={saveGrade} className="space-y-3">
        <input type="hidden" name="attempt_id" value={attemptId} />
        <input type="hidden" name="module" value={module} />
        <div className="flex items-end gap-3">
          <div>
            <label htmlFor={`score-${module}`} className="label-caps block mb-1.5">
              {MODULE_LABEL[module]} score (0–50)
            </label>
            <input
              id={`score-${module}`}
              name="teacher_score"
              type="number"
              min={0}
              max={50}
              step={0.5}
              defaultValue={grade?.teacher_score ?? grade?.ai_score ?? ""}
              required
              className="figures w-28 rounded-md border border-line bg-paper px-3 py-2 text-[15px] focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson"
            />
          </div>
          {grade?.teacher_score != null ? (
            <span className="rounded bg-good-bg text-good px-2 py-1 text-[12px] mb-1">
              saved · {grade.status}
            </span>
          ) : null}
        </div>
        <div>
          <label htmlFor={`fb-${module}`} className="label-caps block mb-1.5">
            Feedback to student
          </label>
          <textarea
            id={`fb-${module}`}
            name="teacher_feedback"
            rows={3}
            defaultValue={grade?.teacher_feedback ?? ""}
            className="w-full rounded-md border border-line bg-paper px-3 py-2 text-[15px] focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson"
          />
        </div>
        <Button type="submit" variant="secondary">
          Save {MODULE_LABEL[module]?.toLowerCase()} grade
        </Button>
      </form>
    </Card>
  );
}
