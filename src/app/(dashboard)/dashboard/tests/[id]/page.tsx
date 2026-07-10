import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { togglePublish } from "../actions";

export default async function TestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: test } = await supabase
    .from("mock_tests")
    .select("id, title, is_published, exam:mock_exams(name)")
    .eq("id", id)
    .maybeSingle();
  if (!test) notFound();

  const { data: sections } = await supabase
    .from("mock_sections")
    .select("id, module, title, duration_seconds, position")
    .eq("test_id", id)
    .order("position");

  const counts = await Promise.all(
    (sections ?? []).map(async (s) => {
      const { count } = await supabase
        .from("mock_section_questions")
        .select("question_id", { count: "exact", head: true })
        .eq("section_id", s.id);
      return count ?? 0;
    })
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label-caps mb-2">
            <Link href="/dashboard/tests" className="hover:text-crimson">
              03 · Tests
            </Link>{" "}
            / detail
          </p>
          <h1 className="text-2xl">{test.title}</h1>
          <p className="text-[13px] text-ink-muted">
            {(test.exam as unknown as { name: string } | null)?.name}
          </p>
        </div>
        <form action={togglePublish}>
          <input type="hidden" name="id" value={test.id} />
          <input type="hidden" name="published" value={String(test.is_published)} />
          <Button variant={test.is_published ? "secondary" : "primary"} type="submit">
            {test.is_published ? "Unpublish" : "Publish"}
          </Button>
        </form>
      </div>

      <Card className="divide-y divide-line">
        {(sections ?? []).map((s, i) => (
          <div key={s.id} className="px-4 py-4 flex items-center gap-4">
            <span className="figures text-ink-muted text-[13px] w-8">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[15px]">{s.title ?? s.module}</p>
              <p className="figures text-[12px] text-ink-muted">
                {Math.round(s.duration_seconds / 60)} min · {counts[i]} question
                {counts[i] === 1 ? "" : "s"}
              </p>
            </div>
            {counts[i] === 0 ? (
              <span className="rounded bg-pending-bg text-pending px-2 py-0.5 text-[11px]">
                empty — skipped in test
              </span>
            ) : null}
            <Link href={`/dashboard/tests/${test.id}/sections/${s.id}`}>
              <Button variant="secondary">Edit questions</Button>
            </Link>
          </div>
        ))}
      </Card>

      <p className="text-[13px] text-ink-muted">
        Publishing makes the test visible to students. Sections without questions
        are skipped automatically in the student flow, so you can publish
        Core/Reading/Listening now and add Writing/Speaking later.
      </p>
    </div>
  );
}
