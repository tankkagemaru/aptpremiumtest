"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";

/** Start (or resume) an auto-generated, randomized attempt for an exam. */
export async function startExamAttempt(formData: FormData) {
  const examId = String(formData.get("exam_id"));
  const profile = await getProfile();
  if (!profile?.studentId) {
    redirect(`/home?error=${encodeURIComponent("No student profile found for this account.")}`);
  }

  const supabase = await createClient();

  // Resume an in-progress attempt for this exam if one exists
  const { data: open } = await supabase
    .from("mock_attempts")
    .select("id, test:mock_tests(exam_id)")
    .eq("student_id", profile.studentId)
    .eq("status", "in_progress");
  const resume = (open ?? []).find(
    (a) => (a.test as unknown as { exam_id: string } | null)?.exam_id === examId
  );
  if (resume) redirect(`/test/${resume.id}`);

  const { data: attemptId, error } = await supabase.rpc("mock_generate_attempt", {
    p_exam: examId,
  });
  if (error || !attemptId) {
    redirect(`/home?error=${encodeURIComponent(error?.message ?? "Could not start the test.")}`);
  }
  redirect(`/test/${attemptId}`);
}

export async function startAttempt(formData: FormData) {
  const testId = String(formData.get("test_id"));
  const profile = await getProfile();
  if (!profile?.studentId) {
    redirect(`/home?error=${encodeURIComponent("No student profile found for this account.")}`);
  }

  const supabase = await createClient();

  // Resume an open attempt if one exists
  const { data: open } = await supabase
    .from("mock_attempts")
    .select("id")
    .eq("test_id", testId)
    .eq("student_id", profile.studentId)
    .eq("status", "in_progress")
    .maybeSingle();
  if (open) redirect(`/test/${open.id}`);

  // Respect the test's attempt limit (null = unlimited practice)
  const { data: test } = await supabase
    .from("mock_tests")
    .select("max_attempts")
    .eq("id", testId)
    .maybeSingle();
  if (test?.max_attempts != null) {
    const { count } = await supabase
      .from("mock_attempts")
      .select("id", { count: "exact", head: true })
      .eq("test_id", testId)
      .eq("student_id", profile.studentId);
    if ((count ?? 0) >= test.max_attempts) {
      redirect(`/home?error=${encodeURIComponent("You have used all attempts for this test.")}`);
    }
  }

  const { data: attempt, error } = await supabase
    .from("mock_attempts")
    .insert({ student_id: profile.studentId, test_id: testId })
    .select("id")
    .single();
  if (error || !attempt) {
    redirect(`/home?error=${encodeURIComponent(error?.message ?? "Could not start the test.")}`);
  }
  redirect(`/test/${attempt.id}`);
}
