/**
 * Speaking-photo generation via the OpenAI Images API. Produces a neutral,
 * exam-appropriate photograph for s2_photo / s3_compare questions from a prompt.
 */

export function isImageConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

/** Wrap a bare topic in an exam-photo style prompt. */
export function buildImagePrompt(topic: string): string {
  return `A realistic, high-quality colour photograph suitable for an English language speaking exam. It clearly shows: ${topic.trim()}. An everyday scene with natural lighting. No text, no captions, no watermarks, no logos.`;
}

export async function generateImage(prompt: string): Promise<Buffer> {
  const model = process.env.OPENAI_IMAGE_MODEL || "dall-e-3";
  const body: Record<string, unknown> = { model, prompt, size: "1024x1024", n: 1 };
  // dall-e-* accepts response_format; gpt-image-1 returns b64 by default.
  if (model.startsWith("dall-e")) body.response_format = "b64_json";

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`OpenAI images ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  const item = data.data?.[0];
  if (item?.b64_json) return Buffer.from(item.b64_json, "base64");
  if (item?.url) {
    const img = await fetch(item.url);
    return Buffer.from(await img.arrayBuffer());
  }
  throw new Error("no image returned");
}
