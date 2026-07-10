"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Row = { id: string; prompt: string | null; ready: boolean };

export function ListeningAudio() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("mock_questions")
      .select("id, prompt, media_url")
      .eq("module", "listening")
      .eq("is_active", true)
      .order("created_at");
    setRows(
      (data ?? []).map((q) => ({
        id: q.id,
        prompt: q.prompt,
        ready: q.media_url === `listening/${q.id}.wav`,
      }))
    );
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generateOne(id: string) {
    setCurrentId(id);
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: id }),
    });
    const j = await res.json();
    if (!res.ok) {
      setLog((l) => [`✗ ${id.slice(0, 8)}: ${j.error}`, ...l]);
      return false;
    }
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ready: true } : r)));
    setLog((l) => [`✓ ${id.slice(0, 8)}: ${Math.round(j.seconds)}s`, ...l]);
    return true;
  }

  async function generateMissing() {
    setRunning(true);
    setLog([]);
    const todo = rows.filter((r) => !r.ready);
    for (const r of todo) {
      // eslint-disable-next-line no-await-in-loop
      await generateOne(r.id);
    }
    setCurrentId(null);
    setRunning(false);
  }

  const missing = rows.filter((r) => !r.ready).length;

  return (
    <div className="space-y-5">
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="figures text-2xl font-display">
              {rows.length - missing}/{rows.length}
            </p>
            <p className="label-caps mt-1">listening questions with audio</p>
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
          Listening audio is voiced from each question&apos;s transcript automatically
          the first time it&apos;s played — no recording needed. Pre-generating here is
          optional: it warms the cache so students never wait on first play.
          Multi-speaker transcripts get distinct voices.
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
        {rows.map((r) => (
          <div key={r.id} className="px-4 py-2.5 flex items-center gap-3">
            <span className="text-[14px] flex-1 min-w-40 truncate">{r.prompt ?? "—"}</span>
            {currentId === r.id ? (
              <span className="text-[12px] text-crimson">generating…</span>
            ) : r.ready ? (
              <span className="rounded bg-good-bg text-good px-2 py-0.5 text-[11px]">audio ready</span>
            ) : (
              <button
                onClick={() => generateOne(r.id)}
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
