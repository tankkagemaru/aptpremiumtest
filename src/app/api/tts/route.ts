import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateListeningAudio, isTtsConfigured } from "@/lib/ai/tts";

export const runtime = "nodejs";
export const maxDuration = 60;

const BUCKET = "mock-media";

async function signedUrlIfExists(
  supabase: Awaited<ReturnType<typeof createClient>>,
  path: string
): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 3);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

/**
 * GET /api/tts?q=<questionId>
 * Serves a listening question's audio. If a cached file exists it redirects to
 * it (free, instant); otherwise it generates the audio from the transcript on
 * the fly, caches it when permissions allow, and streams the bytes back.
 * This is the <audio> source for listening questions — no manual step needed.
 */
export async function GET(request: Request) {
  const questionId = new URL(request.url).searchParams.get("q");
  if (!questionId) return NextResponse.json({ error: "missing q" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "not signed in" }, { status: 401 });

  // The student-safe view exposes passage/media_url without answer keys.
  const { data: q } = await supabase
    .from("mock_questions_student")
    .select("id, module, passage, media_url")
    .eq("id", questionId)
    .maybeSingle();
  if (!q || q.module !== "listening") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const cachePath = `listening/${questionId}.wav`;

  // 1) cached AI audio
  const cached = await signedUrlIfExists(supabase, cachePath);
  if (cached) return NextResponse.redirect(cached, 302);

  // 2) teacher-uploaded custom recording
  if (q.media_url && q.media_url !== cachePath) {
    const custom = await signedUrlIfExists(supabase, q.media_url);
    if (custom) return NextResponse.redirect(custom, 302);
  }

  // 3) generate on the fly
  if (!isTtsConfigured()) {
    return NextResponse.json({ error: "audio unavailable" }, { status: 503 });
  }
  if (!q.passage) return NextResponse.json({ error: "no transcript" }, { status: 404 });

  let audio: Buffer;
  try {
    audio = await generateListeningAudio(q.passage);
  } catch {
    return NextResponse.json({ error: "generation failed" }, { status: 502 });
  }

  // Cache for next time (succeeds for staff; silently skipped for students).
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(cachePath, audio, { contentType: "audio/wav", upsert: true });
  if (!upErr) {
    await supabase.from("mock_questions").update({ media_url: cachePath }).eq("id", questionId);
  }

  return new NextResponse(new Uint8Array(audio), {
    status: 200,
    headers: {
      "Content-Type": "audio/wav",
      "Cache-Control": "private, max-age=3600",
      "Accept-Ranges": "none",
    },
  });
}

/**
 * POST { questionId } — force-generate and cache (staff only). Used by the
 * optional "pre-generate audio" dashboard tool to warm the cache before a test.
 */
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
  if (!q || q.module !== "listening") {
    return NextResponse.json({ error: "Not a listening question." }, { status: 400 });
  }
  if (!q.passage) {
    return NextResponse.json({ error: "This question has no transcript to voice." }, { status: 400 });
  }

  let audio: Buffer;
  try {
    audio = await generateListeningAudio(q.passage);
  } catch (e) {
    return NextResponse.json({ error: `Audio generation failed: ${(e as Error).message}` }, { status: 502 });
  }

  const path = `listening/${questionId}.wav`;
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, audio, { contentType: "audio/wav", upsert: true });
  if (upErr) return NextResponse.json({ error: `Upload failed: ${upErr.message}` }, { status: 500 });

  await supabase.from("mock_questions").update({ media_url: path }).eq("id", questionId);
  return NextResponse.json({ path, seconds: (audio.length - 44) / (24000 * 2) });
}
