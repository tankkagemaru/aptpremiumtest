import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuestionForm } from "@/components/dashboard/question-form";
import { saveQuestion } from "../../actions";

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("mock_questions")
    .select("*, exam:mock_exams(code)")
    .eq("id", id)
    .maybeSingle();
  if (!row) notFound();

  const initial = {
    module: row.module,
    question_type: row.question_type,
    part: row.part ?? undefined,
    prompt: row.prompt ?? undefined,
    passage: row.passage ?? undefined,
    media: row.media_url ?? undefined,
    options: row.options ?? undefined,
    correct_answers: row.correct_answers ?? undefined,
    points: row.points ?? undefined,
    difficulty: row.difficulty ?? undefined,
    tags: row.tags ?? undefined,
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="label-caps mb-2">
          <Link href="/dashboard/questions" className="hover:text-crimson">
            02 · Question bank
          </Link>{" "}
          / edit
        </p>
        <h1 className="text-2xl">Edit question</h1>
        <p className="figures text-[12px] text-ink-muted">
          {row.module} · {row.question_type}
        </p>
      </div>
      <QuestionForm
        examCode={(row.exam as unknown as { code: string } | null)?.code ?? "aptis-general"}
        initial={initial}
        questionId={id}
        saveAction={saveQuestion}
      />
    </div>
  );
}
