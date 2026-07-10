"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { evaluateWriting, type WritingTaskInput } from "@/lib/ai/writing";
import { analyzeResult, type ResultSnapshot } from "@/lib/ai/analysis";

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

/** Finalise scores, verify and release — all in one atomic server function. */
export async function verifyAndRelease(formData: FormData) {
  const attemptId = String(formData.get("attempt_id"));
  const comment = String(formData.get("teacher_comment") ?? "");
  const supabase = await createClient();

  const { error } = await supabase.rpc("mock_verify_and_release", {
    p_attempt: attemptId,
    p_comment: comment,
  });
  if (error) {
    redirect(`${base(attemptId)}?error=${encodeURIComponent(error.message)}`);
  }

  // Generate the AI analysis (strengths/weaknesses + progress vs last attempt)
  await generateAnalysis(attemptId).catch(() => {});

  revalidatePath("/dashboard/grading");
  revalidatePath(base(attemptId));
  redirect(`/dashboard/grading?released=1`);
}

/** Compute and store the AI analysis for a released attempt. Best-effort. */
export async function generateAnalysis(attemptId: string) {
  const supabase = await createClient();

  const { data: cur } = await supabase
    .from("mock_results")
    .select("overall_band, module_scores")
    .eq("attempt_id", attemptId)
    .maybeSingle();
  if (!cur) return;

  const { data: att } = await supabase
    .from("mock_attempts")
    .select("student_id")
    .eq("id", attemptId)
    .maybeSingle();

  let previous = null;
  if (att) {
    const { data: prevAtts } = await supabase
      .from("mock_attempts")
      .select("id, submitted_at")
      .eq("student_id", att.student_id)
      .eq("status", "completed")
      .neq("id", attemptId)
      .order("submitted_at", { ascending: false })
      .limit(1);
    const prevId = prevAtts?.[0]?.id;
    if (prevId) {
      const { data: prevRes } = await supabase
        .from("mock_results")
        .select("overall_band, module_scores")
        .eq("attempt_id", prevId)
        .maybeSingle();
      if (prevRes) previous = prevRes;
    }
  }

  const analysis = await analyzeResult(
    cur as ResultSnapshot,
    (previous as ResultSnapshot | null) ?? null,
    new Date().toISOString()
  );
  if (analysis) {
    await supabase.rpc("mock_set_analysis", { p_attempt: attemptId, p_analysis: analysis });
  }
}

/** Staff button: (re)generate the AI analysis for an already-released attempt. */
export async function regenerateAnalysis(formData: FormData) {
  const attemptId = String(formData.get("attempt_id"));
  await generateAnalysis(attemptId).catch(() => {});
  revalidatePath(base(attemptId));
  redirect(`${base(attemptId)}?analysed=1`);
}
