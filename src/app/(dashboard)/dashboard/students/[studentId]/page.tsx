import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

export default async function StudentDetail({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("id, full_name, email, passport_id, country, created_at")
    .eq("id", studentId)
    .maybeSingle();
  if (!student) notFound();

  const [{ data: attempts }, { data: placement }] = await Promise.all([
    supabase
      .from("mock_attempts")
      .select("id, status, started_at, submitted_at, test:mock_tests(title)")
      .eq("student_id", studentId)
      .order("started_at", { ascending: false }),
    // Read-only placement test history (the placement app owns this data)
    supabase
      .from("test_results")
      .select("id, overall_score, determined_cefr_level, status, submitted_at, official_for_placement")
      .eq("student_id", studentId)
      .order("submitted_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="label-caps mb-2">
          <Link href="/dashboard/students" className="hover:text-crimson">
            04 · Students
          </Link>{" "}
          / {student.full_name}
        </p>
        <h1 className="text-2xl">{student.full_name}</h1>
        <p className="text-[13px] text-ink-muted">
          {student.email}
          {student.country ? ` · ${student.country}` : ""}
        </p>
      </div>

      <section>
        <h2 className="text-lg mb-3">Mock test attempts</h2>
        {(attempts ?? []).length === 0 ? (
          <Card className="p-6">
            <p className="text-[14px] text-ink-muted">No mock attempts yet.</p>
          </Card>
        ) : (
          <Card className="divide-y divide-line">
            {(attempts ?? []).map((a) => {
              const test = a.test as unknown as { title: string } | null;
              const href =
                a.status === "completed"
                  ? `/results/${a.id}/print`
                  : a.status === "grading" || a.status === "submitted"
                    ? `/dashboard/grading/${a.id}`
                    : null;
              const row = (
                <>
                  <div className="min-w-0">
                    <p className="text-[14px] truncate">{test?.title}</p>
                    <p className="figures text-[12px] text-ink-muted">
                      {new Date(a.started_at).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <span className="text-[12px] text-ink-soft shrink-0">{a.status}</span>
                </>
              );
              return href ? (
                <Link
                  key={a.id}
                  href={href}
                  className="px-4 py-2.5 flex items-center justify-between gap-4 hover:bg-cream-50"
                >
                  {row}
                </Link>
              ) : (
                <div key={a.id} className="px-4 py-2.5 flex items-center justify-between gap-4">
                  {row}
                </div>
              );
            })}
          </Card>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg">Placement test</h2>
          <span className="rounded bg-cream-50 border border-line px-2 py-0.5 text-[11px] text-ink-muted">
            read-only
          </span>
        </div>
        {(placement ?? []).length === 0 ? (
          <Card className="p-6">
            <p className="text-[14px] text-ink-muted">
              No placement test results for this student.
            </p>
          </Card>
        ) : (
          <Card className="divide-y divide-line">
            {(placement ?? []).map((p) => (
              <div key={p.id} className="px-4 py-2.5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[14px]">
                    CEFR{" "}
                    <span className="font-display">{p.determined_cefr_level ?? "—"}</span>
                    {p.official_for_placement ? (
                      <span className="ml-2 rounded bg-good-bg text-good px-1.5 py-0.5 text-[11px]">
                        official
                      </span>
                    ) : null}
                  </p>
                  <p className="figures text-[12px] text-ink-muted">
                    {p.submitted_at
                      ? new Date(p.submitted_at).toLocaleDateString("en-GB")
                      : "—"}{" "}
                    · score {p.overall_score ?? "—"}
                  </p>
                </div>
                <span className="text-[12px] text-ink-soft">{p.status}</span>
              </div>
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}
