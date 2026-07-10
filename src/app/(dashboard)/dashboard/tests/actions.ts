"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** APTIS General official section order and durations (seconds). */
const APTIS_SECTIONS = [
  { module: "core", title: "Core — Grammar & Vocabulary", duration_seconds: 25 * 60 },
  { module: "reading", title: "Reading", duration_seconds: 35 * 60 },
  { module: "listening", title: "Listening", duration_seconds: 40 * 60 },
  { module: "writing", title: "Writing", duration_seconds: 50 * 60 },
  { module: "speaking", title: "Speaking", duration_seconds: 12 * 60 },
];

/** Auto-fill targets: module → part → question count (one full APTIS test). */
const AUTOFILL: Record<string, Record<number, number>> = {
  core: { 1: 25, 2: 5 },
  reading: { 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 },
  listening: { 1: 13, 2: 1, 3: 1, 4: 2 },
  writing: { 1: 1, 2: 1, 3: 1, 4: 1 },
  speaking: { 1: 1, 2: 1, 3: 1, 4: 1 },
};

export async function createTest(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const examId = String(formData.get("exam_id") ?? "");
  if (!title || !examId) {
    redirect(`/dashboard/tests?error=${encodeURIComponent("Title is required.")}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: test, error } = await supabase
    .from("mock_tests")
    .insert({ exam_id: examId, title, created_by: user?.id ?? null })
    .select("id")
    .single();
  if (error || !test) {
    redirect(`/dashboard/tests?error=${encodeURIComponent(error?.message ?? "Failed to create test.")}`);
  }

  const sections = APTIS_SECTIONS.map((s, i) => ({
    test_id: test.id,
    module: s.module,
    title: s.title,
    duration_seconds: s.duration_seconds,
    position: i,
  }));
  await supabase.from("mock_sections").insert(sections);

  redirect(`/dashboard/tests/${test.id}`);
}

export async function togglePublish(formData: FormData) {
  const id = String(formData.get("id"));
  const published = String(formData.get("published")) === "true";
  const supabase = await createClient();
  await supabase.from("mock_tests").update({ is_published: !published }).eq("id", id);
  revalidatePath(`/dashboard/tests/${id}`);
  revalidatePath("/dashboard/tests");
}

export async function addQuestionToSection(formData: FormData) {
  const sectionId = String(formData.get("section_id"));
  const questionId = String(formData.get("question_id"));
  const testId = String(formData.get("test_id"));
  const supabase = await createClient();

  const { count } = await supabase
    .from("mock_section_questions")
    .select("question_id", { count: "exact", head: true })
    .eq("section_id", sectionId);

  await supabase.from("mock_section_questions").insert({
    section_id: sectionId,
    question_id: questionId,
    position: count ?? 0,
  });
  revalidatePath(`/dashboard/tests/${testId}/sections/${sectionId}`);
}

export async function removeQuestionFromSection(formData: FormData) {
  const sectionId = String(formData.get("section_id"));
  const questionId = String(formData.get("question_id"));
  const testId = String(formData.get("test_id"));
  const supabase = await createClient();
  await supabase
    .from("mock_section_questions")
    .delete()
    .eq("section_id", sectionId)
    .eq("question_id", questionId);
  revalidatePath(`/dashboard/tests/${testId}/sections/${sectionId}`);
}

/** Fill a section with a full APTIS part-structure from the active bank (random pick per part). */
export async function autoFillSection(formData: FormData) {
  const sectionId = String(formData.get("section_id"));
  const testId = String(formData.get("test_id"));
  const module = String(formData.get("module"));
  const supabase = await createClient();

  const targets = AUTOFILL[module];
  if (!targets) return;

  const { data: bank } = await supabase
    .from("mock_questions")
    .select("id, part")
    .eq("module", module)
    .eq("is_active", true);
  const { data: existing } = await supabase
    .from("mock_section_questions")
    .select("question_id")
    .eq("section_id", sectionId);
  const used = new Set((existing ?? []).map((r) => r.question_id));

  const rows: { section_id: string; question_id: string; position: number }[] = [];
  let position = existing?.length ?? 0;
  const missing: string[] = [];

  for (const [partStr, want] of Object.entries(targets)) {
    const part = Number(partStr);
    const pool = (bank ?? []).filter((q) => q.part === part && !used.has(q.id));
    // Fisher–Yates shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const picked = pool.slice(0, want);
    if (picked.length < want) missing.push(`part ${part}: need ${want}, bank has ${picked.length}`);
    picked.forEach((q) => rows.push({ section_id: sectionId, question_id: q.id, position: position++ }));
  }

  if (rows.length > 0) {
    await supabase.from("mock_section_questions").insert(rows);
  }
  revalidatePath(`/dashboard/tests/${testId}/sections/${sectionId}`);
  if (missing.length > 0) {
    redirect(
      `/dashboard/tests/${testId}/sections/${sectionId}?warn=${encodeURIComponent(
        `Filled what was available. Short: ${missing.join("; ")}`
      )}`
    );
  }
}
