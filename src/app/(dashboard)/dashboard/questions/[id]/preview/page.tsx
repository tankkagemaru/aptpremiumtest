import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QuestionPreview } from "@/components/dashboard/question-preview";
import type { StudentQuestion } from "@/components/test-engine/types";

export const dynamic = "force-dynamic";

export default async function QuestionPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: q } = await supabase
    .from("mock_questions")
    .select("id, module, part, question_type, prompt, passage, media_url, options, points")
    .eq("id", id)
    .maybeSingle();
  if (!q) notFound();

  const sign = async (path: string) => {
    const { data } = await supabase.storage.from("mock-media").createSignedUrl(path, 60 * 60);
    return data?.signedUrl ?? null;
  };

  let signedMediaUrl: string | null = null;
  let options = q.options as Record<string, unknown> | null;

  if (q.module === "listening") {
    signedMediaUrl = `/api/tts?q=${q.id}`;
  } else if (q.media_url) {
    signedMediaUrl = await sign(q.media_url);
  }
  const rawImages = (options?.images as string[] | undefined) ?? [];
  if (rawImages.length > 0) {
    const signedImages = (await Promise.all(rawImages.map(sign))).filter(Boolean);
    options = { ...options, signed_images: signedImages };
  }

  const sq: StudentQuestion = {
    id: q.id,
    module: q.module,
    part: q.part,
    question_type: q.question_type,
    prompt: q.prompt,
    passage: q.passage,
    media_url: q.media_url,
    options,
    points: q.points ?? 1,
    signedMediaUrl,
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label-caps mb-2">
            <Link href="/dashboard/questions" className="hover:text-crimson">
              02 · Question bank
            </Link>{" "}
            / preview
          </p>
          <h1 className="text-2xl">Student preview</h1>
          <p className="figures text-[12px] text-ink-muted">
            {q.module} · {q.question_type}
          </p>
        </div>
        <Link href={`/dashboard/questions/${id}/edit`}>
          <Button variant="secondary">Edit</Button>
        </Link>
      </div>

      <p className="rounded-md bg-cream-50 border border-line text-ink-muted px-3 py-2 text-[12px]">
        This is exactly how a student sees the question. Answers here are not saved.
      </p>

      <Card className="p-6">
        <QuestionPreview q={sq} />
      </Card>
    </div>
  );
}
