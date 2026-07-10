"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Slot = {
  qid: string;
  prompt: string;
  index: number;
  label: string;
  path: string | null;
  url: string | null;
};

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
      if (q.question_type === "s3_compare") {
        const images = ((q.options as { images?: string[] })?.images ?? ["", ""]) as string[];
        next.push({ qid: q.id, prompt, index: 0, label: "photo 1", path: images[0] || null, url: null });
        next.push({ qid: q.id, prompt, index: 1, label: "photo 2", path: images[1] || null, url: null });
      } else {
        next.push({ qid: q.id, prompt, index: 0, label: "photo", path: q.media_url || null, url: null });
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
    setLog((l) => [`✓ ${s.qid.slice(0, 8)} ${s.label}`, ...l]);
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
            <p className="label-caps mt-1">speaking photos generated</p>
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
          Photos are generated with AI from each question&apos;s topic. Set an{" "}
          <code>image_prompt</code> on the question for precise control. Review the
          images below before publishing.
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
        {slots.map((s) => (
          <Card key={key(s)} className="p-3 space-y-2">
            <div className="aspect-[4/3] rounded-md border border-line bg-cream-50 overflow-hidden flex items-center justify-center">
              {s.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.url} alt={s.label} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[12px] text-ink-muted">no image yet</span>
              )}
            </div>
            <p className="text-[13px] truncate" title={s.prompt}>
              {s.prompt}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-ink-muted">{s.label}</span>
              {busyKey === key(s) ? (
                <span className="text-[12px] text-crimson">generating…</span>
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
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
