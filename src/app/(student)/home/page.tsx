import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressTrend } from "@/components/result/progress-trend";
import { startAttempt, startExamAttempt } from "./actions";

export const dynamic = "force-dynamic";

const MODULE_LABELS: Record<string, string> = {
  core: "Core (Grammar & Vocabulary)",
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
  speaking: "Speaking",
};

export default async function StudentHome({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const profile = await getProfile();

  const [{ data: exams }, { data: tests }, { data: attempts }] =
    await Promise.all([
      supabase.from("mock_exams").select("*").order("name"),
      supabase
        .from("mock_tests")
        .select("id, exam_id, title, description")
        .eq("is_published", true)
        .order("created_at", { ascending: false }),
      profile?.studentId
        ? supabase
            .from("mock_attempts")
            .select("id, test_id, status, started_at, test:mock_tests(exam_id)")
            .order("started_at", { ascending: false })
            .limit(10)
        : Promise.resolve({ data: [] as never[] }),
    ]);

  const openByExam = new Map<string, string>(); // exam_id -> attempt_id
  (attempts ?? []).forEach((a) => {
    const examId = (a.test as unknown as { exam_id: string } | null)?.exam_id;
    if (a.status === "in_progress" && examId && !openByExam.has(examId)) {
      openByExam.set(examId, a.id);
    }
  });

  // Length / section count per published test (only sections that have questions)
  const testIds = (tests ?? []).map((t) => t.id);
  const { data: secRows } = testIds.length
    ? await supabase
        .from("mock_sections")
        .select("test_id, duration_seconds, mock_section_questions(question_id)")
        .in("test_id", testIds)
    : { data: [] as { test_id: string; duration_seconds: number; mock_section_questions: unknown[] }[] };
  const testMeta = new Map<string, { minutes: number; sections: number }>();
  (secRows ?? []).forEach((s) => {
    if (((s.mock_section_questions as unknown[]) ?? []).length === 0) return;
    const m = testMeta.get(s.test_id) ?? { minutes: 0, sections: 0 };
    m.minutes += Math.round(s.duration_seconds / 60);
    m.sections += 1;
    testMeta.set(s.test_id, m);
  });

  // Progress trend from released results
  const { data: results } = profile?.studentId
    ? await supabase
        .from("mock_results")
        .select("overall_scale, overall_band, released_at, attempt:mock_attempts(submitted_at)")
        .order("released_at", { ascending: true })
    : { data: [] as never[] };
  const trend = (results ?? [])
    .map((r) => ({
      scale: Number(r.overall_scale ?? 0),
      band: String(r.overall_band ?? ""),
      date: (r.attempt as unknown as { submitted_at: string } | null)?.submitted_at ?? r.released_at,
    }))
    .filter((r) => r.date);

  return (
    <div className="space-y-10">
      <section>
        <p className="label-caps mb-2">01 · Available exams</p>
        <h1 className="text-2xl mb-6">Practice tests</h1>

        {error ? (
          <p className="mb-4 rounded-md bg-alert-bg text-alert px-3 py-2 text-[13px]">
            {error}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          {(exams ?? []).map((exam) => {
            const examTests = (tests ?? []).filter(
              (t) => t.exam_id === exam.id
            );
            return (
              <Card key={exam.id} className="p-6">
                <h2 className="text-lg mb-1">{exam.name}</h2>
                <p className="text-[13px] text-ink-muted mb-4">
                  {exam.description}
                </p>
                <ul className="space-y-1 mb-4">
                  {exam.modules.map((m: string, i: number) => (
                    <li key={m} className="text-[13px] text-ink-soft">
                      <span className="figures text-ink-muted mr-2">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {MODULE_LABELS[m] ?? m}
                    </li>
                  ))}
                </ul>
                {/* Primary: on-demand randomized test from the bank */}
                {profile?.studentId ? (
                  <form action={startExamAttempt}>
                    <input type="hidden" name="exam_id" value={exam.id} />
                    <Button
                      type="submit"
                      variant={openByExam.has(exam.id) ? "secondary" : "primary"}
                      className="w-full"
                    >
                      {openByExam.has(exam.id) ? "Continue practice test" : "Start practice test"}
                    </Button>
                  </form>
                ) : null}
                <p className="text-[12px] text-ink-muted mt-2">
                  A fresh, randomized test is built from the question bank each time.
                </p>

                {/* Optional: curated fixed tests */}
                {examTests.length > 0 ? (
                  <div className="mt-4 border-t border-line pt-3">
                    <p className="label-caps mb-2">Or a set test</p>
                    <ul className="space-y-2">
                      {examTests.map((t) => {
                        const open = (attempts ?? []).find(
                          (a) => a.test_id === t.id && a.status === "in_progress"
                        );
                        return (
                          <li
                            key={t.id}
                            className="border border-line rounded-md px-3 py-2 text-[14px] flex items-center justify-between gap-3"
                          >
                            <span className="min-w-0 truncate">{t.title}</span>
                            {profile?.studentId ? (
                              <form action={startAttempt}>
                                <input type="hidden" name="test_id" value={t.id} />
                                <Button
                                  type="submit"
                                  variant="secondary"
                                  className="!px-3 !py-1.5 text-[13px]"
                                >
                                  {open ? "Continue" : "Start"}
                                </Button>
                              </form>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : null}
              </Card>
            );
          })}

          {/* Coming soon — other exams */}
          {[
            { name: "IELTS", note: "Academic & General Training" },
            { name: "MUET", note: "Malaysian University English Test" },
            { name: "TOEFL", note: "iBT" },
          ].map((e) => (
            <Card key={e.name} className="p-6 opacity-60 select-none">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-lg">{e.name}</h2>
                <span className="rounded bg-cream-50 border border-line text-ink-muted px-2 py-0.5 text-[11px]">
                  Coming soon
                </span>
              </div>
              <p className="text-[13px] text-ink-muted">{e.note}</p>
            </Card>
          ))}
        </div>
      </section>

      <ProgressTrend points={trend} />

      <section>
        <p className="label-caps mb-2">02 · History</p>
        <h2 className="text-xl mb-4">Your attempts</h2>
        {(attempts ?? []).length === 0 ? (
          <Card className="p-6">
            <p className="text-ink-muted text-[14px]">
              No attempts yet. Your completed and in-progress tests will appear
              here.
            </p>
          </Card>
        ) : (
          <Card className="divide-y divide-line">
            {(attempts ?? []).map((a) => {
              const label =
                a.status === "completed"
                  ? "view result"
                  : a.status === "grading" || a.status === "submitted"
                    ? "pending review"
                    : a.status;
              const row = (
                <>
                  <span className="figures text-[13px]">
                    {new Date(a.started_at).toLocaleDateString("en-GB")}
                  </span>
                  <span className="text-[13px] text-ink-soft">{label}</span>
                </>
              );
              return a.status === "completed" ? (
                <Link
                  key={a.id}
                  href={`/results/${a.id}`}
                  className="px-4 py-3 flex items-center justify-between hover:bg-cream-50"
                >
                  {row}
                </Link>
              ) : (
                <div key={a.id} className="px-4 py-3 flex items-center justify-between">
                  {row}
                </div>
              );
            })}
          </Card>
        )}
      </section>
    </div>
  );
}
