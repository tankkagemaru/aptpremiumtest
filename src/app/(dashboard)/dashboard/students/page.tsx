import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const { q, sort } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("students")
    .select("id, full_name, email, country, created_at")
    .limit(200);
  if (q) query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%`);
  query =
    sort === "name"
      ? query.order("full_name")
      : query.order("created_at", { ascending: false });
  const { data: students } = await query;

  // attempt counts
  const ids = (students ?? []).map((s) => s.id);
  const { data: attempts } = ids.length
    ? await supabase.from("mock_attempts").select("student_id").in("student_id", ids)
    : { data: [] as { student_id: string }[] };
  const byStudent = new Map<string, number>();
  (attempts ?? []).forEach((a) =>
    byStudent.set(a.student_id, (byStudent.get(a.student_id) ?? 0) + 1)
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="label-caps mb-2">04 · Students</p>
        <h1 className="text-2xl">Students</h1>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label-caps block mb-1">Search name or email</label>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="text…"
            className="rounded-md border border-line bg-paper px-2.5 py-1.5 text-[13px] focus:outline-none focus:border-crimson"
          />
        </div>
        <select
          name="sort"
          defaultValue={sort ?? ""}
          className="rounded-md border border-line bg-paper px-2.5 py-1.5 text-[13px]"
        >
          <option value="">newest first</option>
          <option value="name">by name</option>
        </select>
        <Button type="submit" variant="secondary">
          Search
        </Button>
        {q || sort ? (
          <Link href="/dashboard/students" className="text-[13px] text-crimson underline underline-offset-2 pb-2">
            Reset
          </Link>
        ) : null}
        <span className="text-[13px] text-ink-muted pb-2 ml-auto">
          <Link href="/dashboard/settings" className="text-crimson underline underline-offset-2">
            Create accounts in Settings →
          </Link>
        </span>
      </form>

      <div>
        <h2 className="text-lg mb-3">
          Students <span className="figures text-[13px] text-ink-muted">({(students ?? []).length})</span>
        </h2>
        {(students ?? []).length === 0 ? (
          <Card className="p-6">
            <p className="text-[14px] text-ink-muted">No students match.</p>
          </Card>
        ) : (
          <Card className="divide-y divide-line">
            {(students ?? []).map((s) => (
              <Link
                key={s.id}
                href={`/dashboard/students/${s.id}`}
                className="px-4 py-2.5 flex items-center justify-between gap-4 hover:bg-cream-50"
              >
                <div className="min-w-0">
                  <p className="text-[14px] truncate">{s.full_name}</p>
                  <p className="text-[12px] text-ink-muted truncate">
                    {s.email}
                    {s.country ? ` · ${s.country}` : ""}
                  </p>
                </div>
                <span className="figures text-[12px] text-ink-muted shrink-0">
                  {byStudent.get(s.id) ?? 0} attempt{(byStudent.get(s.id) ?? 0) === 1 ? "" : "s"}
                </span>
              </Link>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
