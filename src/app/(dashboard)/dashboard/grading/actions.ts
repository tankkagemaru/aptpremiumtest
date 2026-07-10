"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { evaluateWriting, type WritingTaskInput } from "@/lib/ai/writing";

type WritingAnswer = { text?: string; texts?: string[] };

/** Flatten a writing response's JSON into readable text for the AI/teacher. */
function answerToText(answer: WritingAnswer | null): string {
  if (!answer) return "";
  if (answer.text !== undefined) return answer.text;
  if (answer.texts) return answer.texts.filter(Boolean).join("\n\n");
  return "";
}

function base(attemptId: string) {
  return `/dashboard/grading/${attemptId}`;
}

/** Run the OpenAI writing evaluation and store it as an AI suggestion. */
export async function runAiWriting(formData: FormData) {
  const attemptId = String(formData.get("attempt_id"));
  const supabase = await createClient();

  const { data: responses } = await supabase
    .from("mock_responses")
    .select("question_id, answer, question:mock_questions(part, prompt, module)")
    .eq("attempt_id", attemptId);

  const tasks: WritingTaskInput[] = (responses ?? [])
    .filter((r) => (r.question as unknown as { module: string } | null)?.module === "writing")
    .map((r) => {
      const q = r.question as unknown as { part: number; prompt: string };
      return {
        part: q?.part ?? 0,
        prompt: q?.prompt ?? "",
        answer: answerToText(r.answer as WritingAnswer),
      };
    })
    .sort((a, b) => a.part - b.part);

  if (tasks.length === 0) {
    redirect(`${base(attemptId)}?error=${encodeURIComponent("No writing responses to evaluate.")}`);
  }

  const evaluation = await evaluateWriting(tasks);
  if (!evaluation) {
    redirect(
      `${base(attemptId)}?error=${encodeURIComponent(
        "AI evaluation is unavailable. Set OPENAI_API_KEY on the server, or grade manually."
      )}`
    );
  }

  await supabase.from("mock_grades").upsert(
    {
      attempt_id: attemptId,
      module: "writing",
      ai_score: evaluation!.scale_score,
      ai_feedback: {
        rubric: evaluation!.rubric,
        summary: evaluation!.summary,
        per_task: evaluation!.per_task,
        cefr: evaluation!.cefr,
      },
      ai_model: evaluation!.model,
      ai_graded_at: new Date().toISOString(),
      status: "ai_suggested",
    },
    { onConflict: "attempt_id,module" }
  );

  revalidatePath(base(attemptId));
  redirect(base(attemptId));
}

/** Teacher saves a final module score (writing or speaking). */
export async function saveGrade(formData: FormData) {
  const attemptId = String(formData.get("attempt_id"));
  const module = String(formData.get("module"));
  const score = Number(formData.get("teacher_score"));
  const feedback = String(formData.get("teacher_feedback") ?? "");

  if (Number.isNaN(score) || score < 0 || score > 50) {
    redirect(`${base(attemptId)}?error=${encodeURIComponent("Score must be between 0 and 50.")}`);
  }

  const profile = await getProfile();
  const supabase = await createClient();

  // If an AI suggestion exists and the teacher changed it, mark 'overridden'.
  const { data: existing } = await supabase
    .from("mock_grades")
    .select("ai_score")
    .eq("attempt_id", attemptId)
    .eq("module", module)
    .maybeSingle();
  const status =
    existing?.ai_score != null && Number(existing.ai_score) !== score
      ? "overridden"
      : "approved";

  await supabase.from("mock_grades").upsert(
    {
      attempt_id: attemptId,
      module,
      teacher_score: score,
      teacher_feedback: feedback,
      graded_by: profile?.userId ?? null,
      graded_at: new Date().toISOString(),
      status,
    },
    { onConflict: "attempt_id,module" }
  );

  revalidatePath(base(attemptId));
  redirect(base(attemptId));
}

/** Finalise scores, then verify and release the result to the student. */
export async function verifyAndRelease(formData: FormData) {
  const attemptId = String(formData.get("attempt_id"));
  const comment = String(formData.get("teacher_comment") ?? "");
  const profile = await getProfile();
  const supabase = await createClient();

  const { error: finErr } = await supabase.rpc("mock_finalize_result", {
    p_attempt: attemptId,
  });
  if (finErr) {
    redirect(`${base(attemptId)}?error=${encodeURIComponent(finErr.message)}`);
  }

  const { error: relErr } = await supabase
    .from("mock_results")
    .update({
      verified_by: profile?.userId ?? null,
      verified_at: new Date().toISOString(),
      released_at: new Date().toISOString(),
      teacher_comment: comment || null,
    })
    .eq("attempt_id", attemptId);
  if (relErr) {
    redirect(`${base(attemptId)}?error=${encodeURIComponent(relErr.message)}`);
  }

  await supabase.from("mock_attempts").update({ status: "completed" }).eq("id", attemptId);

  revalidatePath("/dashboard/grading");
  redirect(`/dashboard/grading?released=1`);
}
