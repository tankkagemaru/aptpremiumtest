"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  validateImportFile,
  validateQuestion,
  TYPE_PARTS,
  type ImportQuestion,
} from "@/lib/question-import";

const PAGE = "/dashboard/questions";

function fail(errors: string[]): never {
  const msg = errors.slice(0, 8).join(" • ");
  redirect(`${PAGE}?error=${encodeURIComponent(msg)}`);
}

export async function importQuestions(formData: FormData) {
  const files = formData
    .getAll("file")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) fail(["Choose one or more .json files first."]);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let imported = 0;

  for (const file of files) {
    if (file.size > 5 * 1024 * 1024) fail([`${file.name} is larger than 5 MB.`]);
    let raw: unknown;
    try {
      raw = JSON.parse(await file.text());
    } catch {
      fail([`${file.name} is not valid JSON.`]);
    }
    const result = validateImportFile(raw);
    if (!result.ok || !result.file) {
      fail([`${file.name}:`, ...result.errors]);
    }
    const data = result.file;

    const { data: exam } = await supabase
      .from("mock_exams")
      .select("id")
      .eq("code", data.exam)
      .maybeSingle();
    if (!exam) fail([`${file.name}: unknown exam code "${data.exam}".`]);

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

    for (let i = 0; i < rows.length; i += 50) {
      const chunk = rows.slice(i, i + 50);
      const { error } = await supabase.from("mock_questions").insert(chunk);
      if (error) {
        fail([`Imported ${imported} so far, then ${file.name} failed: ${error.message}`]);
      }
      imported += chunk.length;
    }
  }

  revalidatePath(PAGE);
  redirect(`${PAGE}?imported=${imported}&files=${files.length}`);
}

/** Create or update one question from the form-based editor. */
export async function saveQuestion(payload: string): Promise<{ error?: string } | void> {
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
  redirect(PAGE);
}

/** Delete every question carrying a given tag (a whole set). Questions that
 *  already have student answers are retired instead of deleted. */
export async function deleteSet(formData: FormData) {
  const tag = String(formData.get("tag") ?? "").trim();
  if (!tag) fail(["No set specified."]);

  const supabase = await createClient();
  const { data: qs } = await supabase
    .from("mock_questions")
    .select("id")
    .contains("tags", [tag]);
  const ids = (qs ?? []).map((q) => q.id);
  if (ids.length === 0) fail([`No questions found with tag "${tag}".`]);

  // Detach from any tests first (section links have no cascade)
  await supabase.from("mock_section_questions").delete().in("question_id", ids);

  // Questions with recorded answers can't be deleted — retire them
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
  redirect(
    `${PAGE}?deleted=${deletable.length}&retired=${retire.length}&tag=${encodeURIComponent(tag)}`
  );
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
