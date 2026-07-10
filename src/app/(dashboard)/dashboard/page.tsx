import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

export default async function DashboardOverview() {
  const supabase = await createClient();

  const [questions, tests, attempts, pendingGrades] = await Promise.all([
    supabase
      .from("mock_questions")
      .select("id", { count: "exact", head: true }),
    supabase.from("mock_tests").select("id", { count: "exact", head: true }),
    supabase
      .from("mock_attempts")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("mock_grades")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "ai_suggested"]),
  ]);

  const stats = [
    { label: "Questions in bank", value: questions.count ?? 0 },
    { label: "Tests", value: tests.count ?? 0 },
    { label: "Attempts", value: attempts.count ?? 0 },
    { label: "Awaiting grading", value: pendingGrades.count ?? 0 },
  ];

  return (
    <div>
      <p className="label-caps mb-2">01 · Overview</p>
      <h1 className="text-2xl mb-6">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-6">
            <p className="figures text-3xl font-display">{s.value}</p>
            <p className="label-caps mt-2">{s.label}</p>
          </Card>
        ))}
      </div>
      <Card className="mt-8 p-6">
        <p className="text-[14px] text-ink-muted">
          Question bank, test builder, student management and the grading queue
          arrive in Phases 2–3.
        </p>
      </Card>
    </div>
  );
}
