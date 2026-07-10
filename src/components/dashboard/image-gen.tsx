"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Slot = { qid: string; prompt: string; index: number; label: string; ready: boolean };

export function ImageGen() {
  const supabase = useMemo(() => createClient(), []);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

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
        next.push({ qid: q.id, prompt, index: 0, label: "photo 1", ready: Boolean(images[0]) });
        next.push({ qid: q.id, prompt, index: 1, label: "photo 2", ready: Boolean(images[1]) });
      } else {
        next.push({ qid: q.id, prompt, index: 0, label: "photo", ready: Boolean(q.media_url) });
      }
    });
    setSlots(next);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const key = (s: Slot) => `${s.qid}:${s.index}`;

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
    setSlots((ss) => ss.map((x) => (key(x) === key(s) ? { ...x, ready: true } : x)));
    setLog((l) => [`✓ ${s.qid.slice(0, 8)} ${s.label}`, ...l]);
  }

  async function generateMissing() {
    setRunning(true);
    setLog([]);
    for (const s of slots.filter((x) => !x.ready)) {
      // eslint-disable-next-line no-await-in-loop
      await generate(s);
    }
    setRunning(false);
  }

  const missing = slots.filter((s) => !s.ready).length;

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
          <code>image_prompt</code> (or <code>image_prompts</code> for compare
          tasks) on the question for precise control; otherwise the topic is taken
          from the question. Review generated images before publishing.
        </p>
      </Card>

      {log.length > 0 ? (
        <Card className="p-4 max-h-56 overflow-auto">
          <ul className="space-y-1 text-[13px] figures">
            {log.map((l, i) => (
              <li key={i} className={l.startsWith("✗") ? "text-alert" : "text-good"}>
                {l}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card className="divide-y divide-line">
        {slots.map((s) => (
          <div key={key(s)} className="px-4 py-2.5 flex items-center gap-3">
            <span className="text-[14px] flex-1 min-w-40 truncate">{s.prompt}</span>
            <span className="text-[12px] text-ink-muted w-16">{s.label}</span>
            {busyKey === key(s) ? (
              <span className="text-[12px] text-crimson">generating…</span>
            ) : s.ready ? (
              <button
                onClick={() => generate(s)}
                disabled={running}
                className="text-[12px] text-ink-muted underline underline-offset-2 cursor-pointer disabled:opacity-50"
              >
                regenerate
              </button>
            ) : (
              <button
                onClick={() => generate(s)}
                disabled={running}
                className="text-[12px] text-crimson underline underline-offset-2 cursor-pointer disabled:opacity-50"
              >
                generate
              </button>
            )}
          </div>
        ))}
      </Card>
    </div>
  );
}
