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

export type GeneratedImage = { buffer: Buffer; ext: string; contentType: string };

export async function generateImage(prompt: string): Promise<GeneratedImage> {
  const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
  // No response_format: gpt-image-1 rejects it (returns b64_json by default);
  // dall-e-* returns a url by default. The handler below copes with either.
  const body: Record<string, unknown> = { model, prompt, size: "1024x1024", n: 1 };
  let jpeg = false;
  if (model === "gpt-image-1") {
    // Education use — keep files small and cheap.
    body.quality = process.env.OPENAI_IMAGE_QUALITY || "low";
    body.output_format = "jpeg";
    body.output_compression = 70;
    jpeg = true;
  }

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
  const meta = jpeg
    ? { ext: "jpg", contentType: "image/jpeg" }
    : { ext: "png", contentType: "image/png" };
  if (item?.b64_json) return { buffer: Buffer.from(item.b64_json, "base64"), ...meta };
  if (item?.url) {
    const img = await fetch(item.url);
    return { buffer: Buffer.from(await img.arrayBuffer()), ...meta };
  }
  throw new Error("no image returned");
}
