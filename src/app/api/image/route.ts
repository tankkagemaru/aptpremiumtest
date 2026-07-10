import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateImage, buildImagePrompt, isImageConfigured } from "@/lib/ai/image";

export const runtime = "nodejs";
export const maxDuration = 60;

const BUCKET = "mock-media";

/** POST { questionId, index? } — generate a speaking photo and store it. Staff only. */
export async function POST(request: Request) {
  if (!isImageConfigured()) {
    return NextResponse.json({ error: "OPENAI_API_KEY is not set on the server." }, { status: 400 });
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { data: userRow } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
  if (!userRow || !["teacher", "admin"].includes(userRow.role)) {
    return NextResponse.json({ error: "Staff only." }, { status: 403 });
  }

  let questionId: string;
  let index = 0;
  try {
    const b = await request.json();
    questionId = b.questionId;
    index = Number(b.index ?? 0);
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const { data: q } = await supabase
    .from("mock_questions")
    .select("id, module, question_type, prompt, options, media_url")
    .eq("id", questionId)
    .maybeSingle();
  if (!q || q.module !== "speaking") {
    return NextResponse.json({ error: "Not a speaking question." }, { status: 400 });
  }

  const options = (q.options ?? {}) as Record<string, unknown>;
  const questions = (options.questions as string[]) ?? [];
  const derive = () =>
    questions.find((x) => !/describe|compare|picture|photo/i.test(x)) ??
    questions[1] ??
    q.prompt ??
    "an everyday scene";

  let topic: string;
  if (q.question_type === "s3_compare") {
    const prompts = (options.image_prompts as string[]) ?? [];
    topic = prompts[index] || `${derive()} (variation ${index + 1})`;
  } else {
    topic = (options.image_prompt as string) || derive();
  }

  let img: Awaited<ReturnType<typeof generateImage>>;
  try {
    img = await generateImage(buildImagePrompt(topic));
  } catch (e) {
    return NextResponse.json({ error: `Image generation failed: ${(e as Error).message}` }, { status: 502 });
  }

  const path = `speaking/${questionId}${q.question_type === "s3_compare" ? `-${index}` : ""}.${img.ext}`;
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, img.buffer, { contentType: img.contentType, upsert: true });
  if (upErr) return NextResponse.json({ error: `Upload failed: ${upErr.message}` }, { status: 500 });

  if (q.question_type === "s3_compare") {
    const images = [...((options.images as string[]) ?? ["", ""])];
    images[index] = path;
    await supabase
      .from("mock_questions")
      .update({ options: { ...options, images } })
      .eq("id", questionId);
  } else {
    await supabase.from("mock_questions").update({ media_url: path }).eq("id", questionId);
  }

  return NextResponse.json({ path });
}
