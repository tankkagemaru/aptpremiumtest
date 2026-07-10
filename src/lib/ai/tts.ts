/**
 * Listening-audio generation via the OpenAI TTS API.
 *
 * Turns a listening question's transcript (the `passage`) into speech, so no
 * audio recording/upload is needed. Multi-speaker transcripts (e.g. "[Man] …
 * [Woman] …") are split by speaker cue and each speaker gets a distinct voice,
 * then the WAV segments are concatenated — so speaker-matching tasks still work.
 */

const VOICES = ["onyx", "nova", "echo", "shimmer", "alloy", "fable"];

type Fmt = { channels: number; sampleRate: number; bitsPerSample: number };

export function isTtsConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

/** Split a transcript into { label, text } speaker segments. */
function segmentize(transcript: string): { label: string; text: string }[] {
  const t = transcript.replace(/^\s*TRANSCRIPT:\s*/i, "").trim();
  const segs: { label: string; text: string }[] = [];
  const re = /\[([^\]]+)\]/g;
  let last = 0;
  let label = "Narrator";
  let m: RegExpExecArray | null;
  while ((m = re.exec(t)) !== null) {
    const before = t.slice(last, m.index).trim();
    if (before) segs.push({ label, text: before });
    label = m[1].trim();
    last = re.lastIndex;
  }
  const tail = t.slice(last).trim();
  if (tail) segs.push({ label, text: tail });
  if (segs.length === 0 && t) segs.push({ label: "Narrator", text: t });
  return segs;
}

async function synth(text: string, voice: string): Promise<Buffer> {
  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TTS_MODEL || "tts-1",
      voice,
      input: text,
      response_format: "wav",
    }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI TTS ${res.status}: ${await res.text()}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

function parseWav(buf: Buffer): Fmt & { data: Buffer } {
  if (buf.toString("ascii", 0, 4) !== "RIFF") throw new Error("not a WAV file");
  let offset = 12;
  let fmt: Fmt | null = null;
  let data: Buffer | null = null;
  while (offset + 8 <= buf.length) {
    const id = buf.toString("ascii", offset, offset + 4);
    const size = buf.readUInt32LE(offset + 4);
    const body = buf.subarray(offset + 8, offset + 8 + size);
    if (id === "fmt ") {
      fmt = {
        channels: body.readUInt16LE(2),
        sampleRate: body.readUInt32LE(4),
        bitsPerSample: body.readUInt16LE(14),
      };
    } else if (id === "data") {
      data = body;
    }
    offset += 8 + size + (size % 2);
  }
  if (!fmt || !data) throw new Error("WAV missing fmt/data chunk");
  return { ...fmt, data };
}

function buildWav(fmt: Fmt, pcm: Buffer): Buffer {
  const { channels, sampleRate, bitsPerSample } = fmt;
  const blockAlign = (channels * bitsPerSample) / 8;
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * blockAlign, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

/** Generate a single WAV Buffer for a whole transcript (multi-voice aware). */
export async function generateListeningAudio(transcript: string): Promise<Buffer> {
  const segments = segmentize(transcript);
  const voiceByLabel = new Map<string, string>();
  const parts: Buffer[] = [];
  let fmt: Fmt | null = null;

  for (const seg of segments) {
    if (!seg.text.trim()) continue;
    let voice = voiceByLabel.get(seg.label);
    if (!voice) {
      voice = VOICES[voiceByLabel.size % VOICES.length];
      voiceByLabel.set(seg.label, voice);
    }
    const parsed = parseWav(await synth(seg.text, voice));
    fmt = { channels: parsed.channels, sampleRate: parsed.sampleRate, bitsPerSample: parsed.bitsPerSample };
    parts.push(parsed.data);
    // ~0.35s gap between speakers
    const gap = Math.floor(parsed.sampleRate * 0.35) * ((parsed.channels * parsed.bitsPerSample) / 8);
    parts.push(Buffer.alloc(gap));
  }

  if (!fmt) throw new Error("nothing to synthesize");
  return buildWav(fmt, Buffer.concat(parts));
}
