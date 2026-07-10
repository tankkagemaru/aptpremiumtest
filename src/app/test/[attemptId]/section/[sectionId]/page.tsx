import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { TestRunner } from "@/components/test-engine/test-runner";
import type { Answer, StudentQuestion } from "@/components/test-engine/types";
import { submitSection } from "../../actions";

export default async function SectionPage({
  params,
}: {
  params: Promise<{ attemptId: string; sectionId: string }>;
}) {
  const { attemptId, sectionId } = await params;
  const supabase = await createClient();
  const profile = await getProfile();
  if (!profile?.studentId) redirect("/home");

  const { data: attempt } = await supabase
    .from("mock_attempts")
    .select("id, test_id, status, section_deadlines")
    .eq("id", attemptId)
    .maybeSingle();
  if (!attempt) notFound();
  if (attempt.status !== "in_progress") redirect(`/test/${attemptId}`);

  const deadline = (attempt.section_deadlines as Record<string, string>)[sectionId];
  if (!deadline) redirect(`/test/${attemptId}`);

  const { data: section } = await supabase
    .from("mock_sections")
    .select("id, module, title")
    .eq("id", sectionId)
    .eq("test_id", attempt.test_id)
    .maybeSingle();
  if (!section) notFound();

  const { data: sq } = await supabase
    .from("mock_section_questions")
    .select("question_id, position")
    .eq("section_id", sectionId)
    .order("position");
  const ids = (sq ?? []).map((r) => r.question_id);
  if (ids.length === 0) redirect(`/test/${attemptId}`);

  const [{ data: rawQuestions }, { data: responses }] = await Promise.all([
    supabase.from("mock_questions_student").select("*").in("id", ids),
    supabase
      .from("mock_responses")
      .select("question_id, answer")
      .eq("attempt_id", attemptId)
      .in("question_id", ids),
  ]);

  const byId = new Map((rawQuestions ?? []).map((q) => [q.id, q]));
  const orderedQuestions = ids
    .map((id) => byId.get(id))
    .filter(Boolean) as StudentQuestion[];

  // Resolve signed URLs for audio/images (valid for the section duration)
  const sign = async (path: string) => {
    const { data } = await supabase.storage
      .from("mock-media")
      .createSignedUrl(path, 60 * 60 * 3);
    return data?.signedUrl ?? null;
  };
  const questions: StudentQuestion[] = await Promise.all(
    orderedQuestions.map(async (q) => {
      const signedMediaUrl = q.media_url ? await sign(q.media_url) : null;
      // s3_compare keeps its two images inside options.images
      const rawImages = (q.options?.images as string[] | undefined) ?? [];
      if (rawImages.length > 0) {
        const signedImages = (await Promise.all(rawImages.map(sign))).filter(Boolean);
        return {
          ...q,
          signedMediaUrl,
          options: { ...q.options, signed_images: signedImages },
        };
      }
      return { ...q, signedMediaUrl };
    })
  );

  const initialAnswers: Record<string, Answer> = {};
  (responses ?? []).forEach((r) => {
    initialAnswers[r.question_id] = (r.answer ?? {}) as Answer;
  });

  async function submit() {
    "use server";
    await submitSection(attemptId, sectionId);
  }

  return (
    <TestRunner
      attemptId={attemptId}
      studentId={profile.studentId}
      sectionModule={section.module}
      sectionTitle={section.title ?? section.module}
      deadline={deadline}
      questions={questions}
      initialAnswers={initialAnswers}
      submitAction={submit}
    />
  );
}
