"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { importQuestionsFile } from "@/app/(dashboard)/dashboard/questions/actions";
import type { ImportFileResult } from "@/lib/question-import";

type LogLine = ImportFileResult & { pending?: boolean };

export function QuestionImport() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0); // files processed
  const [log, setLog] = useState<LogLine[]>([]);

  const total = files.length;
  const importedTotal = log.reduce((n, l) => n + (l.imported ?? 0), 0);
  const failedCount = log.filter((l) => !l.pending && !l.ok).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  async function run() {
    if (files.length === 0 || running) return;
    setRunning(true);
    setDone(0);
    setLog([]);

    let processed = 0;
    for (const file of files) {
      setLog((l) => [...l, { file: file.name, ok: false, imported: 0, pending: true }]);
      let result: ImportFileResult;
      try {
        // eslint-disable-next-line no-await-in-loop
        const text = await file.text();
        // eslint-disable-next-line no-await-in-loop
        result = await importQuestionsFile(file.name, text);
      } catch (e) {
        result = { file: file.name, ok: false, imported: 0, error: (e as Error).message };
      }
      processed += 1;
      setDone(processed);
      setLog((l) => l.map((x) => (x.pending && x.file === file.name ? { ...result } : x)));
    }

    setRunning(false);
    router.refresh(); // update module counts + question list
  }

  function reset() {
    setFiles([]);
    setLog([]);
    setDone(0);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg mb-1">Import questions</h2>
      <p className="text-[13px] text-ink-muted mb-4">
        Upload one or more .json files in the import format. Select several at once
        to import a whole set. Each file is validated before anything is saved, and
        imported one at a time so you can see exactly what succeeded.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept=".json,application/json"
          multiple
          disabled={running}
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="text-[13px] text-ink-soft file:mr-3 file:rounded-md file:border file:border-line file:bg-paper file:px-3 file:py-1.5 file:text-ink disabled:opacity-50"
        />
        <Button onClick={run} disabled={running || files.length === 0}>
          {running ? "Importing…" : `Import${total ? ` ${total} file${total === 1 ? "" : "s"}` : ""}`}
        </Button>
        {(log.length > 0 || files.length > 0) && !running ? (
          <Button variant="ghost" onClick={reset}>
            Clear
          </Button>
        ) : null}
      </div>

      {/* Progress bar */}
      {running || done > 0 ? (
        <div className="mt-4 space-y-1.5">
          <div className="h-2 rounded-full bg-cream-50 border border-line overflow-hidden">
            <div
              className="h-full bg-crimson transition-[width] duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="figures text-[12px] text-ink-muted">
            {done}/{total} files · {importedTotal} question{importedTotal === 1 ? "" : "s"} imported
            {failedCount ? ` · ${failedCount} failed` : ""}
            {running ? "" : done === total ? " · done" : ""}
          </p>
        </div>
      ) : null}

      {/* Per-file log */}
      {log.length > 0 ? (
        <ul className="mt-4 space-y-1 text-[13px]">
          {log.map((l, i) => (
            <li
              key={i}
              className={`flex items-start gap-2 rounded-md px-2.5 py-1.5 ${
                l.pending
                  ? "bg-cream-50 text-ink-muted"
                  : l.ok
                    ? "bg-good-bg text-good"
                    : "bg-alert-bg text-alert"
              }`}
            >
              <span className="shrink-0">{l.pending ? "…" : l.ok ? "✓" : "✗"}</span>
              <span className="font-medium">{l.file}</span>
              <span className="text-ink-muted">
                {l.pending
                  ? "importing…"
                  : l.ok
                    ? `${l.imported} question${l.imported === 1 ? "" : "s"}${l.module ? ` · ${l.module}` : ""}`
                    : l.error}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}
