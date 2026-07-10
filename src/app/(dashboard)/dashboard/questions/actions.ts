"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { validateImportFile, TYPE_PARTS } from "@/lib/question-import";

const PAGE = "/dashboard/questions";

function fail(errors: string[]): never {
  const msg = errors.slice(0, 8).join(" • ");
  redirect(`${PAGE}?error=${encodeURIComponent(msg)}`);
}

export async function importQuestions(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) fail(["Choose a .json file first."]);
  if (file.size > 5 * 1024 * 1024) fail(["File is larger than 5 MB."]);

  let raw: unknown;
  try {
    raw = JSON.parse(await file.text());
  } catch {
    fail(["The file is not valid JSON."]);
  }

  const result = validateImportFile(raw);
  if (!result.ok || !result.file) fail(result.errors);
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
  if (!exam) fail([`Unknown exam code "${data.exam}".`]);

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

  // Insert in chunks so one bad row doesn't abort a large import silently.
  let imported = 0;
  for (let i = 0; i < rows.length; i += 50) {
    const chunk = rows.slice(i, i + 50);
    const { error } = await supabase.from("mock_questions").insert(chunk);
    if (error) fail([`Imported ${imported} of ${rows.length}, then failed: ${error.message}`]);
    imported += chunk.length;
  }

  revalidatePath(PAGE);
  redirect(`${PAGE}?imported=${imported}&module=${data.module}`);
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
