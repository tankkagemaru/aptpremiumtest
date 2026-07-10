import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  addQuestionToSection,
  removeQuestionFromSection,
  autoFillSection,
} from "../../../actions";

export default async function SectionEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; sectionId: string }>;
  searchParams: Promise<{ warn?: string }>;
}) {
  const { id, sectionId } = await params;
  const { warn } = await searchParams;
  const supabase = await createClient();

  const { data: section } = await supabase
    .from("mock_sections")
    .select("id, module, title, test:mock_tests(id, title)")
    .eq("id", sectionId)
    .eq("test_id", id)
    .maybeSingle();
  if (!section) notFound();

  const [{ data: assigned }, { data: bank }] = await Promise.all([
    supabase
      .from("mock_section_questions")
      .select("question_id, position")
      .eq("section_id", sectionId)
      .order("position"),
    supabase
      .from("mock_questions")
      .select("id, part, question_type, prompt, difficulty")
      .eq("module", section.module)
      .eq("is_active", true)
      .order("part")
      .order("created_at"),
  ]);

  const assignedIds = new Set((assigned ?? []).map((a) => a.question_id));
  const byId = new Map((bank ?? []).map((q) => [q.id, q]));
  const assignedQuestions = (assigned ?? [])
    .map((a) => byId.get(a.question_id))
    .filter(Boolean);
  const available = (bank ?? []).filter((q) => !assignedIds.has(q.id));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="label-caps mb-2">
            <Link href={`/dashboard/tests/${id}`} className="hover:text-crimson">
              {(section.test as unknown as { title: string } | null)?.title}
            </Link>{" "}
            / {section.module}
          </p>
          <h1 className="text-2xl">{section.title ?? section.module}</h1>
        </div>
        <form action={autoFillSection}>
          <input type="hidden" name="section_id" value={sectionId} />
          <input type="hidden" name="test_id" value={id} />
          <input type="hidden" name="module" value={section.module} />
          <Button type="submit">Auto-fill (APTIS structure)</Button>
        </form>
      </div>

      {warn ? (
        <p className="rounded-md bg-pending-bg text-pending px-3 py-2 text-[13px]">{warn}</p>
      ) : null}

      <section>
        <h2 className="text-lg mb-3">
          In this section{" "}
          <span className="figures text-[13px] text-ink-muted">
            ({assignedQuestions.length})
          </span>
        </h2>
        {assignedQuestions.length === 0 ? (
          <Card className="p-6">
            <p className="text-[14px] text-ink-muted">
              Empty — add questions below or use auto-fill.
            </p>
          </Card>
        ) : (
          <Card className="divide-y divide-line">
            {assignedQuestions.map((q, i) => (
              <div key={q!.id} className="px-4 py-2.5 flex items-center gap-4">
                <span className="figures text-[12px] text-ink-muted w-6">{i + 1}</span>
                <span className="figures text-[12px] text-ink-muted w-8">P{q!.part}</span>
                <span className="text-[13px] text-ink-soft w-36 shrink-0 hidden md:inline">
                  {q!.question_type}
                </span>
                <span className="text-[14px] flex-1 min-w-40 truncate">
                  {q!.prompt ?? "—"}
                </span>
                <span className="figures text-[12px] text-ink-muted w-8">
                  {q!.difficulty ?? ""}
                </span>
                <form action={removeQuestionFromSection}>
                  <input type="hidden" name="section_id" value={sectionId} />
                  <input type="hidden" name="test_id" value={id} />
                  <input type="hidden" name="question_id" value={q!.id} />
                  <Button variant="ghost" type="submit" className="!px-2 !py-1 text-[12px] text-alert">
                    Remove
                  </Button>
                </form>
              </div>
            ))}
          </Card>
        )}
      </section>

      <section>
        <h2 className="text-lg mb-3">
          Available in bank{" "}
          <span className="figures text-[13px] text-ink-muted">({available.length})</span>
        </h2>
        {available.length === 0 ? (
          <Card className="p-6">
            <p className="text-[14px] text-ink-muted">
              Nothing left for this module —{" "}
              <Link href="/dashboard/questions" className="text-crimson underline underline-offset-2">
                import more questions
              </Link>
              .
            </p>
          </Card>
        ) : (
          <Card className="divide-y divide-line">
            {available.map((q) => (
              <div key={q.id} className="px-4 py-2.5 flex items-center gap-4">
                <span className="figures text-[12px] text-ink-muted w-8">P{q.part}</span>
                <span className="text-[13px] text-ink-soft w-36 shrink-0 hidden md:inline">
                  {q.question_type}
                </span>
                <span className="text-[14px] flex-1 min-w-40 truncate">{q.prompt ?? "—"}</span>
                <span className="figures text-[12px] text-ink-muted w-8">
                  {q.difficulty ?? ""}
                </span>
                <form action={addQuestionToSection}>
                  <input type="hidden" name="section_id" value={sectionId} />
                  <input type="hidden" name="test_id" value={id} />
                  <input type="hidden" name="question_id" value={q.id} />
                  <Button variant="ghost" type="submit" className="!px-2 !py-1 text-[12px]">
                    Add
                  </Button>
                </form>
              </div>
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}
