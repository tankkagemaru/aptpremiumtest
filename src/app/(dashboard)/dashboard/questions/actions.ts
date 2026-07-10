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

/** Jump to a random active question's editor (optionally within a module). */
export async function editRandomQuestion(formData: FormData) {
  const module = String(formData.get("module") ?? "");
  const supabase = await createClient();
  let query = supabase.from("mock_questions").select("id").eq("is_active", true);
  if (module) query = query.eq("module", module);
  const { data } = await query;
  if (!data || data.length === 0) {
    redirect(`${PAGE}?error=${encodeURIComponent("No questions to edit yet.")}`);
  }
  const pick = data![Math.floor(Math.random() * data!.length)];
  redirect(`${PAGE}/${pick.id}/edit`);
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
