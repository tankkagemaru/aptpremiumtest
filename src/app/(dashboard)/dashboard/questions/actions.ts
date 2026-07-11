"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  validateImportFile,
  validateQuestion,
  TYPE_PARTS,
  type ImportQuestion,
  type ImportFileResult,
} from "@/lib/question-import";

const PAGE = "/dashboard/questions";

function fail(errors: string[]): never {
  const msg = errors.slice(0, 8).join(" • ");
  redirect(`${PAGE}?error=${encodeURIComponent(msg)}`);
}

/** Validate and import a single .json file. Returns a per-file result so the
 *  client can show progress and a success/error line for each file. */
export async function importQuestionsFile(
  fileName: string,
  text: string
): Promise<ImportFileResult> {
  const name = fileName || "file.json";
  if (text.length > 5 * 1024 * 1024) {
    return { file: name, ok: false, imported: 0, error: "larger than 5 MB" };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { file: name, ok: false, imported: 0, error: "not valid JSON" };
  }

  const result = validateImportFile(raw);
  if (!result.ok || !result.file) {
    return { file: name, ok: false, imported: 0, error: result.errors.join("; ") };
  }
  const data = result.file;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: exam } = await supabase
    .from("mock_exams")
    .select("id")
    .eq("code", data.exam)
    .maybeSingle();
  if (!exam) {
    return { file: name, ok: false, imported: 0, error: `unknown exam code "${data.exam}"` };
  }

  const rows = data.questions.map((q) => ({
    exam_id: exam.id,
    module: data.module,
    part: q.part ?? TYPE_PARTS[q.question_type].part,
    question_type: q.question_type,
    prompt: q.prompt ?? null,
    passage: q.passage ?? null,
    media_url: q.media ?? null,
    options: q.options ?? null,
    correct_answers: q.correct_answers ?? null,
    points: q.points ?? 1,
    difficulty: q.difficulty ?? null,
    tags: q.tags ?? null,
    created_by: user?.id ?? null,
  }));

  let imported = 0;
  for (let i = 0; i < rows.length; i += 50) {
    const chunk = rows.slice(i, i + 50);
    const { error } = await supabase.from("mock_questions").insert(chunk);
    if (error) {
      return {
        file: name,
        ok: false,
        imported,
        module: data.module,
        exam: data.exam,
        error: `${error.message} (after ${imported})`,
      };
    }
    imported += chunk.length;
  }

  revalidatePath(PAGE);
  return { file: name, ok: true, imported, module: data.module, exam: data.exam };
}

/** Create or update one question from the form-based editor.
 *  Returns { ok } on success so a modal caller can close + refresh in place
 *  (standalone pages navigate themselves). */
export async function saveQuestion(
  payload: string
): Promise<{ ok?: true; error?: string }> {
  const parsed = JSON.parse(payload) as {
    id?: string;
    exam: string;
    module: string;
    question: ImportQuestion;
  };
  const q = parsed.question;

  const errors = validateQuestion(q);
  if (errors.length) return { error: errors.join(" • ") };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: exam } = await supabase
    .from("mock_exams")
    .select("id")
    .eq("code", parsed.exam)
    .maybeSingle();
  if (!exam) return { error: `Unknown exam "${parsed.exam}".` };

  const row = {
    exam_id: exam.id,
    module: parsed.module,
    part: q.part ?? TYPE_PARTS[q.question_type].part,
    question_type: q.question_type,
    prompt: q.prompt ?? null,
    passage: q.passage ?? null,
    media_url: q.media ?? null,
    options: q.options ?? null,
    correct_answers: q.correct_answers ?? null,
    points: q.points ?? 1,
    difficulty: q.difficulty ?? null,
    tags: q.tags ?? null,
  };

  if (parsed.id) {
    const { error } = await supabase.from("mock_questions").update(row).eq("id", parsed.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("mock_questions")
      .insert({ ...row, created_by: user?.id ?? null });
    if (error) return { error: error.message };
  }

  revalidatePath(PAGE);
  return { ok: true };
}

/** Delete a selected set of questions (retire any that already have answers). */
export async function bulkDeleteQuestions(formData: FormData) {
  const ids = formData.getAll("ids").map(String).filter(Boolean);
  if (ids.length === 0) fail(["Select at least one question."]);

  const supabase = await createClient();
  await supabase.from("mock_section_questions").delete().in("question_id", ids);
  const { data: used } = await supabase
    .from("mock_responses")
    .select("question_id")
    .in("question_id", ids);
  const usedIds = new Set((used ?? []).map((r) => r.question_id));
  const deletable = ids.filter((id) => !usedIds.has(id));
  const retire = ids.filter((id) => usedIds.has(id));

  if (deletable.length) await supabase.from("mock_questions").delete().in("id", deletable);
  if (retire.length) {
    await supabase.from("mock_questions").update({ is_active: false }).in("id", retire);
  }
  revalidatePath(PAGE);
  redirect(`${PAGE}?deleted=${deletable.length}&retired=${retire.length}&tag=selection`);
}

/** Retire or restore a selected set of questions. */
export async function bulkSetActive(formData: FormData) {
  const ids = formData.getAll("ids").map(String).filter(Boolean);
  const active = String(formData.get("active")) === "true";
  if (ids.length === 0) fail(["Select at least one question."]);
  const supabase = await createClient();
  await supabase.from("mock_questions").update({ is_active: active }).in("id", ids);
  revalidatePath(PAGE);
  redirect(PAGE);
}

export async function toggleQuestionActive(formData: FormData) {
  const id = String(formData.get("id"));
  const active = String(formData.get("active")) === "true";
  const supabase = await createClient();
  await supabase.from("mock_questions").update({ is_active: !active }).eq("id", id);
  revalidatePath(PAGE);
}

export async function deleteQuestion(formData: FormData) {
  const id = String(formData.get("id"));
  const supabase = await createClient();
  const { error } = await supabase.from("mock_questions").delete().eq("id", id);
  if (error) {
    // FK from responses: the question has been used in attempts — retire instead.
    redirect(
      `${PAGE}?error=${encodeURIComponent(
        "This question has student answers attached; it was not deleted. Use Retire instead."
      )}`
    );
  }
  revalidatePath(PAGE);
}
