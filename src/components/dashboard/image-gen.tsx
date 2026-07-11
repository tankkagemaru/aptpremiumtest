"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { setSpeakingImage } from "@/app/(dashboard)/dashboard/questions/images/actions";

type Slot = {
  qid: string;
  qtype: string;
  prompt: string;
  index: number;
  label: string;
  /** the effective prompt sent to the image model */
  imagePrompt: string;
  /** true when the prompt was set explicitly on the question (vs. derived) */
  explicit: boolean;
  path: string | null;
  url: string | null;
};

/** Mirror the server's fallback when no explicit image_prompt is set. */
function derive(questions: string[], prompt: string | null): string {
  return (
    questions.find((x) => !/describe|compare|picture|photo/i.test(x)) ??
    questions[1] ??
    prompt ??
    "an everyday scene"
  );
}

export function ImageGen() {
  const supabase = useMemo(() => createClient(), []);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const key = (s: { qid: string; index: number }) => `${s.qid}:${s.index}`;

  async function sign(path: string): Promise<string | null> {
    const { data } = await supabase.storage.from("mock-media").createSignedUrl(path, 60 * 60);
    return data?.signedUrl ?? null;
  }

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("mock_questions")
      .select("id, question_type, prompt, media_url, options")
      .eq("module", "speaking")
      .in("question_type", ["s2_photo", "s3_compare"])
      .eq("is_active", true)
      .order("created_at");

    const next: Slot[] = [];
    (data ?? []).forEach((q) => {
      const prompt = q.prompt ?? "—";
      const options = (q.options ?? {}) as Record<string, unknown>;
      const questions = (options.questions as string[]) ?? [];
      if (q.question_type === "s3_compare") {
        const images = ((options.images as string[]) ?? ["", ""]) as string[];
        const iprompts = (options.image_prompts as string[]) ?? [];
        [0, 1].forEach((i) => {
          const explicit = Boolean(iprompts[i]);
          next.push({
            qid: q.id,
            qtype: q.question_type,
            prompt,
            index: i,
            label: `photo ${i + 1}`,
            imagePrompt: explicit ? iprompts[i] : `${derive(questions, q.prompt)} (variation ${i + 1})`,
            explicit,
            path: images[i] || null,
            url: null,
          });
        });
      } else {
        const explicit = Boolean(options.image_prompt);
        next.push({
          qid: q.id,
          qtype: q.question_type,
          prompt,
          index: 0,
          label: "photo",
          imagePrompt: explicit ? (options.image_prompt as string) : derive(questions, q.prompt),
          explicit,
          path: q.media_url || null,
          url: null,
        });
      }
    });
    // resolve signed URLs for existing images
    await Promise.all(
      next.map(async (s) => {
        if (s.path) s.url = await sign(s.path);
      })
    );
    setSlots(next);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generate(s: Slot) {
    setBusyKey(key(s));
    const res = await fetch("/api/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: s.qid, index: s.index }),
    });
    const j = await res.json();
    setBusyKey(null);
    if (!res.ok) {
      setLog((l) => [`✗ ${s.qid.slice(0, 8)} ${s.label}: ${j.error}`, ...l]);
      return;
    }
    const url = await sign(j.path);
    setSlots((ss) => ss.map((x) => (key(x) === key(s) ? { ...x, path: j.path, url } : x)));
    setLog((l) => [`✓ generated ${s.qid.slice(0, 8)} ${s.label}`, ...l]);
  }

  async function upload(s: Slot, file: File) {
    setBusyKey(key(s));
    const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `speaking/${s.qid}${s.qtype === "s3_compare" ? `-${s.index}` : ""}-manual-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("mock-media")
      .upload(path, file, { upsert: true, contentType: file.type || undefined });
    if (upErr) {
      setBusyKey(null);
      setLog((l) => [`✗ upload ${s.qid.slice(0, 8)} ${s.label}: ${upErr.message}`, ...l]);
      return;
    }
    const res = await setSpeakingImage(s.qid, s.index, path);
    setBusyKey(null);
    if (res.error) {
      setLog((l) => [`✗ save ${s.qid.slice(0, 8)} ${s.label}: ${res.error}`, ...l]);
      return;
    }
    const url = await sign(path);
    setSlots((ss) => ss.map((x) => (key(x) === key(s) ? { ...x, path, url } : x)));
    setLog((l) => [`✓ uploaded ${s.qid.slice(0, 8)} ${s.label}`, ...l]);
  }

  async function generateMissing() {
    setRunning(true);
    setLog([]);
    for (const s of slots.filter((x) => !x.path)) {
      // eslint-disable-next-line no-await-in-loop
      await generate(s);
    }
    setRunning(false);
  }

  const missing = slots.filter((s) => !s.path).length;

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="figures text-2xl font-display">
              {slots.length - missing}/{slots.length}
            </p>
            <p className="label-caps mt-1">speaking photos ready</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={load} disabled={running || loading}>
              Refresh
            </Button>
            <Button onClick={generateMissing} disabled={running || loading || missing === 0}>
              {running ? "Generating…" : `Generate ${missing} missing`}
            </Button>
          </div>
        </div>
        <p className="text-[13px] text-ink-muted mt-3">
          Each photo is generated by AI from the prompt shown on its card. Set an{" "}
          <code>image_prompt</code> on the question (in the wizard) for precise control,
          or <strong>upload your own photo</strong> instead. Review before publishing.
        </p>
      </Card>

      {log.length > 0 ? (
        <Card className="p-4 max-h-40 overflow-auto">
          <ul className="space-y-1 text-[13px] figures">
            {log.map((l, i) => (
              <li key={i} className={l.startsWith("✗") ? "text-alert" : "text-good"}>
                {l}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {slots.map((s) => {
          const busy = busyKey === key(s);
          return (
            <Card key={key(s)} className="p-3 space-y-2 flex flex-col">
              <div className="aspect-[4/3] rounded-md border border-line bg-cream-50 overflow-hidden flex items-center justify-center">
                {s.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.url} alt={s.label} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[12px] text-ink-muted">no image yet</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[12px] text-ink-muted">{s.label}</span>
                {s.path ? (
                  <span className="rounded bg-good-bg text-good px-1.5 py-0.5 text-[11px]">ready</span>
                ) : (
                  <span className="rounded bg-pending-bg text-pending px-1.5 py-0.5 text-[11px]">
                    missing
                  </span>
                )}
              </div>

              <p className="text-[12px] text-ink-soft truncate" title={s.prompt}>
                {s.prompt}
              </p>

              {/* The prompt that will be sent to the image model */}
              <div className="rounded-md border border-line bg-cream-50 p-2">
                <p className="label-caps mb-0.5 flex items-center gap-1.5">
                  Image prompt
                  <span
                    className={`rounded px-1 py-0.5 text-[10px] ${
                      s.explicit
                        ? "bg-paper border border-line text-ink-muted"
                        : "bg-pending-bg text-pending"
                    }`}
                  >
                    {s.explicit ? "set on question" : "auto (from questions)"}
                  </span>
                </p>
                <p className="text-[12px] leading-5 text-ink">{s.imagePrompt}</p>
              </div>

              <div className="mt-auto flex items-center justify-between pt-1">
                {busy ? (
                  <span className="text-[12px] text-crimson">working…</span>
                ) : (
                  <button
                    onClick={() => generate(s)}
                    disabled={running}
                    className={`text-[12px] underline underline-offset-2 cursor-pointer disabled:opacity-50 ${
                      s.path ? "text-ink-muted" : "text-crimson"
                    }`}
                  >
                    {s.path ? "regenerate" : "generate"}
                  </button>
                )}
                <label
                  className={`text-[12px] cursor-pointer text-ink-soft hover:text-crimson underline underline-offset-2 ${
                    running || busy ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  upload photo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void upload(s, f);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
