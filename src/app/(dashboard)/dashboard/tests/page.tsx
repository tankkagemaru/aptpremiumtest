import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { createTest } from "./actions";

export default async function TestsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; q?: string; status?: string; deleted?: string }>;
}) {
  const { error, q, status, deleted } = await searchParams;
  const supabase = await createClient();

  let testQuery = supabase
    .from("mock_tests")
    .select("id, title, is_published, created_at, exam:mock_exams(name)")
    .order("created_at", { ascending: false });
  if (q) testQuery = testQuery.ilike("title", `%${q}%`);
  if (status === "published") testQuery = testQuery.eq("is_published", true);
  else if (status === "draft") testQuery = testQuery.eq("is_published", false);

  const [{ data: tests }, { data: exams }] = await Promise.all([
    testQuery,
    supabase.from("mock_exams").select("id, name").eq("is_active", true),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="label-caps mb-2">03 · Tests</p>
        <h1 className="text-2xl">Test builder</h1>
      </div>

      {error ? (
        <p className="rounded-md bg-alert-bg text-alert px-3 py-2 text-[13px]">{error}</p>
      ) : null}
      {deleted ? (
        <p className="rounded-md bg-good-bg text-good px-3 py-2 text-[13px]">Test deleted.</p>
      ) : null}

      <Card className="p-6">
        <h2 className="text-lg mb-4">Create a test</h2>
        <form action={createTest} className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-56">
            <Field label="Title" htmlFor="title">
              <Input id="title" name="title" placeholder="APTIS General — Mock 1" required />
            </Field>
          </div>
          <div>
            <Field label="Exam" htmlFor="exam_id">
              <select
                id="exam_id"
                name="exam_id"
                className="rounded-md border border-line bg-paper px-3 py-2 text-[14px]"
              >
                {(exams ?? []).map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Button type="submit">Create</Button>
        </form>
        <p className="text-[12px] text-ink-muted mt-3">
          The five APTIS sections are created automatically with official timings —
          you then fill each one from the question bank.
        </p>
      </Card>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label-caps block mb-1">Search title</label>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="text…"
            className="rounded-md border border-line bg-paper px-2.5 py-1.5 text-[13px] focus:outline-none focus:border-crimson"
          />
        </div>
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded-md border border-line bg-paper px-2.5 py-1.5 text-[13px]"
        >
          <option value="">all</option>
          <option value="published">published</option>
          <option value="draft">draft</option>
        </select>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>

      {(tests ?? []).length === 0 ? (
        <Card className="p-6">
          <p className="text-[14px] text-ink-muted">No tests match.</p>
        </Card>
      ) : (
        <Card className="divide-y divide-line">
          {(tests ?? []).map((t) => (
            <Link
              key={t.id}
              href={`/dashboard/tests/${t.id}`}
              className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-cream-50"
            >
              <div className="min-w-0">
                <p className="text-[15px] truncate">{t.title}</p>
                <p className="text-[12px] text-ink-muted">
                  {(t.exam as unknown as { name: string } | null)?.name}
                </p>
              </div>
              <span
                className={`rounded px-2 py-0.5 text-[11px] shrink-0 ${
                  t.is_published ? "bg-good-bg text-good" : "bg-pending-bg text-pending"
                }`}
              >
                {t.is_published ? "published" : "draft"}
              </span>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
