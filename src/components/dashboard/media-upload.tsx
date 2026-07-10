"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type Uploaded = { path: string; error?: string };

const FOLDERS = ["listening", "speaking", "reading", "shared"];

/** Uploads audio/images to the mock-media bucket; the returned path is what
 *  question JSON references in its "media" field. */
export function MediaUpload() {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [folder, setFolder] = useState("listening");
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Uploaded[]>([]);

  async function upload() {
    const files = inputRef.current?.files;
    if (!files || files.length === 0) return;
    setBusy(true);
    const out: Uploaded[] = [];
    for (const file of Array.from(files)) {
      const clean = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
      const path = `${folder}/${clean}`;
      const { error } = await supabase.storage
        .from("mock-media")
        .upload(path, file, { upsert: true });
      out.push({ path, error: error?.message });
    }
    setResults(out);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={folder}
          onChange={(e) => setFolder(e.target.value)}
          className="rounded-md border border-line bg-paper px-3 py-2 text-[14px]"
        >
          {FOLDERS.map((f) => (
            <option key={f} value={f}>
              {f}/
            </option>
          ))}
        </select>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="audio/*,image/*"
          className="text-[13px] text-ink-soft file:mr-3 file:rounded-md file:border file:border-line file:bg-paper file:px-3 file:py-1.5 file:text-ink"
        />
        <Button variant="secondary" onClick={upload} disabled={busy}>
          {busy ? "Uploading…" : "Upload"}
        </Button>
      </div>
      {results.length > 0 && (
        <ul className="space-y-1">
          {results.map((r) => (
            <li key={r.path} className="text-[13px]">
              {r.error ? (
                <span className="text-alert">{r.path} — {r.error}</span>
              ) : (
                <>
                  <span className="text-good">✓</span>{" "}
                  <code className="figures bg-cream-50 border border-line rounded px-1.5 py-0.5">
                    {r.path}
                  </code>{" "}
                  <span className="text-ink-muted">
                    — use this as &quot;media&quot; in question JSON
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
