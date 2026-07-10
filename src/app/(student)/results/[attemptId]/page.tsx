import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { ScoreTable } from "@/components/result/score-table";
import { CEFR_LABEL, MODULE_LABEL, type ModuleScores } from "@/lib/scoring/cefr";

export default async function StudentResult({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const supabase = await createClient();

  // RLS returns this row only if released_at is set and it's the student's own.
  const { data: result } = await supabase
    .from("mock_results")
    .select("module_scores, overall_scale, overall_band, teacher_comment, released_at")
    .eq("attempt_id", attemptId)
    .maybeSingle();
  if (!result) notFound();

  const { data: grades } = await supabase
    .from("mock_grades")
    .select("module, teacher_feedback")
    .eq("attempt_id", attemptId);

  const scores = result.module_scores as ModuleScores;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label-caps mb-2">Result</p>
          <h1 className="text-2xl">Your score report</h1>
        </div>
        <Link
          href={`/results/${attemptId}/print`}
          className="text-[13px] text-crimson underline underline-offset-2"
        >
          Print / PDF
        </Link>
      </div>

      <Card className="p-6 text-center">
        <p className="label-caps mb-2">Overall</p>
        <p className="figures font-display text-5xl">{result.overall_band}</p>
        <p className="text-ink-muted text-[14px] mt-1">
          {CEFR_LABEL[result.overall_band ?? ""] ?? ""} ·{" "}
          <span className="figures">{result.overall_scale}</span>/50
        </p>
      </Card>

      <Card className="p-6">
        <ScoreTable scores={scores} />
      </Card>

      {result.teacher_comment ? (
        <Card className="p-6">
          <p className="label-caps mb-2">Teacher comment</p>
          <p className="text-[15px] leading-6 whitespace-pre-wrap">{result.teacher_comment}</p>
        </Card>
      ) : null}

      {(grades ?? []).some((g) => g.teacher_feedback) ? (
        <Card className="p-6 space-y-3">
          <p className="label-caps">Feedback by module</p>
          {(grades ?? [])
            .filter((g) => g.teacher_feedback)
            .map((g) => (
              <div key={g.module}>
                <p className="text-[13px] font-medium">{MODULE_LABEL[g.module] ?? g.module}</p>
                <p className="text-[14px] leading-6 whitespace-pre-wrap text-ink-soft">
                  {g.teacher_feedback}
                </p>
              </div>
            ))}
        </Card>
      ) : null}

      <p className="text-[12px] text-ink-muted text-center">
        This is a practice result. Scale scores use provisional band boundaries and
        are indicative, not an official APTIS result.
      </p>
    </div>
  );
}
