import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

export default async function GradingQueue({
  searchParams,
}: {
  searchParams: Promise<{ released?: string }>;
}) {
  const { released } = await searchParams;
  const supabase = await createClient();

  // Attempts awaiting attention: submitted (auto-only, ready to verify) or grading (needs manual marking)
  const { data: attempts } = await supabase
    .from("mock_attempts")
    .select(
      "id, status, submitted_at, student:students(full_name, email), test:mock_tests(title)"
    )
    .in("status", ["submitted", "grading"])
    .order("submitted_at", { ascending: true });

  // Which of these already have manual grades in place
  const ids = (attempts ?? []).map((a) => a.id);
  const { data: grades } = ids.length
    ? await supabase
        .from("mock_grades")
        .select("attempt_id, module, teacher_score")
        .in("attempt_id", ids)
    : { data: [] as { attempt_id: string; module: string; teacher_score: number | null }[] };

  const gradedModules = new Map<string, Set<string>>();
  (grades ?? []).forEach((g) => {
    if (g.teacher_score == null) return;
    if (!gradedModules.has(g.attempt_id)) gradedModules.set(g.attempt_id, new Set());
    gradedModules.get(g.attempt_id)!.add(g.module);
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="label-caps mb-2">05 · Grading</p>
        <h1 className="text-2xl">Grading queue</h1>
      </div>

      {released ? (
        <p className="rounded-md bg-good-bg text-good px-3 py-2 text-[13px]">
          Result verified and released to the student.
        </p>
      ) : null}

      {(attempts ?? []).length === 0 ? (
        <Card className="p-6">
          <p className="text-[14px] text-ink-muted">
            Nothing waiting. Submitted attempts that need marking or verification
            appear here.
          </p>
        </Card>
      ) : (
        <Card className="divide-y divide-line">
          {(attempts ?? []).map((a) => {
            const student = a.student as unknown as { full_name: string; email: string } | null;
            const test = a.test as unknown as { title: string } | null;
            const done = gradedModules.get(a.id);
            return (
              <Link
                key={a.id}
                href={`/dashboard/grading/${a.id}`}
                className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-cream-50"
              >
                <div className="min-w-0">
                  <p className="text-[15px] truncate">{student?.full_name ?? "Unknown"}</p>
                  <p className="text-[12px] text-ink-muted truncate">
                    {test?.title} ·{" "}
                    <span className="figures">
                      {a.submitted_at
                        ? new Date(a.submitted_at).toLocaleDateString("en-GB")
                        : "—"}
                    </span>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {done && done.size > 0 ? (
                    <span className="rounded bg-good-bg text-good px-2 py-0.5 text-[11px]">
                      {done.size} graded
                    </span>
                  ) : null}
                  <span
                    className={`rounded px-2 py-0.5 text-[11px] ${
                      a.status === "grading"
                        ? "bg-pending-bg text-pending"
                        : "bg-crimson-bg text-crimson"
                    }`}
                  >
                    {a.status === "grading" ? "needs marking" : "ready to verify"}
                  </span>
                </div>
              </Link>
            );
          })}
        </Card>
      )}
    </div>
  );
}
