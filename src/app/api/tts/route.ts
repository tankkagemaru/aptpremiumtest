import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateListeningAudio, isTtsConfigured } from "@/lib/ai/tts";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Generate listening audio from a question's transcript and store it. Staff only. */
export async function POST(request: Request) {
  if (!isTtsConfigured()) {
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
  try {
    ({ questionId } = await request.json());
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const { data: q } = await supabase
    .from("mock_questions")
    .select("id, module, passage")
    .eq("id", questionId)
    .maybeSingle();
  if (!q) return NextResponse.json({ error: "Question not found." }, { status: 404 });
  if (q.module !== "listening") {
    return NextResponse.json({ error: "Not a listening question." }, { status: 400 });
  }
  if (!q.passage) {
    return NextResponse.json({ error: "This question has no transcript to voice." }, { status: 400 });
  }

  let audio: Buffer;
  try {
    audio = await generateListeningAudio(q.passage);
  } catch (e) {
    return NextResponse.json(
      { error: `Audio generation failed: ${(e as Error).message}` },
      { status: 502 }
    );
  }

  const path = `listening/${questionId}.wav`;
  const { error: upErr } = await supabase.storage
    .from("mock-media")
    .upload(path, audio, { contentType: "audio/wav", upsert: true });
  if (upErr) {
    return NextResponse.json({ error: `Upload failed: ${upErr.message}` }, { status: 500 });
  }

  await supabase.from("mock_questions").update({ media_url: path }).eq("id", questionId);

  return NextResponse.json({ path, seconds: (audio.length - 44) / (24000 * 2) });
}
