import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DashboardOverview() {
  const supabase = await createClient();

  const [questions, publishedTests, attempts, awaiting] = await Promise.all([
    supabase.from("mock_questions").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("mock_tests").select("id", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("mock_attempts").select("id", { count: "exact", head: true }),
    supabase
      .from("mock_attempts")
      .select("id", { count: "exact", head: true })
      .in("status", ["submitted", "grading"]),
  ]);

  const stats = [
    { label: "Active questions", value: questions.count ?? 0, href: "/dashboard/questions" },
    { label: "Published tests", value: publishedTests.count ?? 0, href: "/dashboard/tests" },
    { label: "Total attempts", value: attempts.count ?? 0, href: "/dashboard/students" },
    { label: "Awaiting grading", value: awaiting.count ?? 0, href: "/dashboard/grading" },
  ];

  const { data: queue } = await supabase
    .from("mock_attempts")
    .select("id, status, submitted_at, student:students(full_name), test:mock_tests(title)")
    .in("status", ["submitted", "grading"])
    .order("submitted_at", { ascending: true })
    .limit(6);

  const links = [
    { label: "Question bank", href: "/dashboard/questions" },
    { label: "Tests", href: "/dashboard/tests" },
    { label: "Grading", href: "/dashboard/grading" },
    { label: "Students", href: "/dashboard/students" },
    { label: "Settings", href: "/dashboard/settings" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="label-caps mb-2">01 · Overview</p>
        <h1 className="text-2xl">Dashboard</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="p-6 hover:border-crimson transition-colors">
              <p className="figures text-3xl font-display">{s.value}</p>
              <p className="label-caps mt-2">{s.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg">Awaiting grading</h2>
          <Link href="/dashboard/grading" className="text-[13px] text-crimson underline underline-offset-2">
            Open queue
          </Link>
        </div>
        {(queue ?? []).length === 0 ? (
          <Card className="p-6">
            <p className="text-[14px] text-ink-muted">Nothing waiting to grade.</p>
          </Card>
        ) : (
          <Card className="divide-y divide-line">
            {(queue ?? []).map((a) => {
              const student = a.student as unknown as { full_name: string } | null;
              const test = a.test as unknown as { title: string } | null;
              return (
                <Link
                  key={a.id}
                  href={`/dashboard/grading/${a.id}`}
                  className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-cream-50"
                >
                  <div className="min-w-0">
                    <p className="text-[14px] truncate">{student?.full_name ?? "Unknown"}</p>
                    <p className="text-[12px] text-ink-muted truncate">{test?.title}</p>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-[11px] shrink-0 ${
                      a.status === "grading" ? "bg-pending-bg text-pending" : "bg-crimson-bg text-crimson"
                    }`}
                  >
                    {a.status === "grading" ? "needs marking" : "ready to verify"}
                  </span>
                </Link>
              );
            })}
          </Card>
        )}
      </section>

      <section>
        <h2 className="text-lg mb-3">Quick links</h2>
        <div className="flex flex-wrap gap-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md border border-line bg-paper px-3 py-1.5 text-[13px] hover:border-crimson"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
