import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MODULES, TYPE_PARTS } from "@/lib/question-import";
import { BulkQuestionList } from "@/components/dashboard/bulk-question-list";
import { importQuestions, deleteSet, bulkDeleteQuestions, bulkSetActive } from "./actions";

const CEFR = ["A1", "A2", "B1", "B2", "C1", "C2"];
const inputCls =
  "rounded-md border border-line bg-paper px-2.5 py-1.5 text-[13px] focus:outline-none focus:border-crimson";

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    imported?: string;
    files?: string;
    deleted?: string;
    retired?: string;
    tag?: string;
    q?: string;
    module?: string;
    part?: string;
    difficulty?: string;
    type?: string;
    status?: string;
  }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  // Module counts
  const counts = await Promise.all(
    MODULES.map(async (m) => {
      const { count } = await supabase
        .from("mock_questions")
        .select("id", { count: "exact", head: true })
        .eq("module", m);
      return { module: m, count: count ?? 0 };
    })
  );

  // Tag/set aggregation
  const { data: tagRows } = await supabase.from("mock_questions").select("tags");
  const tagCounts = new Map<string, number>();
  (tagRows ?? []).forEach((r) =>
    ((r.tags as string[] | null) ?? []).forEach((t) =>
      tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1)
    )
  );
  const tags = [...tagCounts.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  // Filtered list
  let query = supabase
    .from("mock_questions")
    .select("id, module, part, question_type, prompt, difficulty, is_active")
    .order("module")
    .order("part")
    .order("created_at", { ascending: false })
    .limit(200);
  if (sp.module) query = query.eq("module", sp.module);
  if (sp.part) query = query.eq("part", Number(sp.part));
  if (sp.difficulty) query = query.eq("difficulty", sp.difficulty);
  if (sp.type) query = query.eq("question_type", sp.type);
  if (sp.q) query = query.ilike("prompt", `%${sp.q}%`);
  if (sp.status === "retired") query = query.eq("is_active", false);
  else if (sp.status !== "all") query = query.eq("is_active", true);
  const { data: questions } = await query;

  const typeOptions = sp.module
    ? Object.keys(TYPE_PARTS).filter((t) => TYPE_PARTS[t].module === sp.module)
    : Object.keys(TYPE_PARTS);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="label-caps mb-2">02 · Question bank</p>
          <h1 className="text-2xl">Question bank</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/questions/audio">
            <Button variant="secondary">Listening audio</Button>
          </Link>
          <Link href="/dashboard/questions/images">
            <Button variant="secondary">Speaking images</Button>
          </Link>
          <Link href="/dashboard/questions/new">
            <Button>+ Add question</Button>
          </Link>
        </div>
      </div>

      {sp.error ? (
        <p className="rounded-md bg-alert-bg text-alert px-3 py-2 text-[13px]">{sp.error}</p>
      ) : null}
      {sp.imported ? (
        <p className="rounded-md bg-good-bg text-good px-3 py-2 text-[13px]">
          Imported {sp.imported} question{sp.imported === "1" ? "" : "s"}
          {sp.files ? ` from ${sp.files} file${sp.files === "1" ? "" : "s"}` : ""}.
        </p>
      ) : null}
      {sp.deleted || sp.retired ? (
        <p className="rounded-md bg-good-bg text-good px-3 py-2 text-[13px]">
          Set “{sp.tag}”: deleted {sp.deleted ?? 0}
          {sp.retired && sp.retired !== "0" ? `, retired ${sp.retired} (had answers)` : ""}.
        </p>
      ) : null}

      {/* Module cards */}
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {counts.map((c) => (
          <Link key={c.module} href={`/dashboard/questions?module=${c.module}`}>
            <Card
              className={`p-4 hover:border-crimson transition-colors ${
                sp.module === c.module ? "border-crimson" : ""
              }`}
            >
              <p className="figures text-2xl font-display">{c.count}</p>
              <p className="label-caps mt-1">{c.module}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Sets & tags */}
      {tags.length > 0 ? (
        <section>
          <h2 className="text-lg mb-3">Sets &amp; tags</h2>
          <Card className="p-4 flex flex-wrap gap-2">
            {tags.map(([tag, n]) => (
              <div
                key={tag}
                className="inline-flex items-center gap-2 rounded-md border border-line bg-cream-50 pl-3 pr-1.5 py-1"
              >
                <Link
                  href={`/dashboard/questions?q=&tag=${encodeURIComponent(tag)}`}
                  className="text-[13px]"
                >
                  {tag} <span className="figures text-ink-muted">{n}</span>
                </Link>
                <form action={deleteSet}>
                  <input type="hidden" name="tag" value={tag} />
                  <button
                    type="submit"
                    className="text-alert text-[14px] px-1 cursor-pointer hover:bg-alert-bg rounded"
                    title={`Delete all ${n} questions tagged ${tag}`}
                  >
                    ×
                  </button>
                </form>
              </div>
            ))}
          </Card>
          <p className="text-[12px] text-ink-muted mt-2">
            The × deletes every question in that set (questions already used in an
            attempt are retired, not deleted).
          </p>
        </section>
      ) : null}

      {/* Import */}
      <Card className="p-6">
        <h2 className="text-lg mb-1">Import questions</h2>
        <p className="text-[13px] text-ink-muted mb-4">
          Upload one or more .json files in the import format. Select several at
          once to import a whole set. Each file is validated before anything is saved.
        </p>
        <form action={importQuestions} className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            name="file"
            accept=".json,application/json"
            multiple
            required
            className="text-[13px] text-ink-soft file:mr-3 file:rounded-md file:border file:border-line file:bg-paper file:px-3 file:py-1.5 file:text-ink"
          />
          <Button type="submit">Import</Button>
        </form>
      </Card>

      {/* Filter + search */}
      <section>
        <form method="get" className="flex flex-wrap items-end gap-3 mb-4">
          <div>
            <label className="label-caps block mb-1">Search prompt</label>
            <input name="q" defaultValue={sp.q ?? ""} placeholder="text…" className={inputCls} />
          </div>
          <select name="module" defaultValue={sp.module ?? ""} className={inputCls}>
            <option value="">all modules</option>
            {MODULES.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <select name="type" defaultValue={sp.type ?? ""} className={inputCls}>
            <option value="">all types</option>
            {typeOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select name="part" defaultValue={sp.part ?? ""} className={inputCls}>
            <option value="">any part</option>
            {[1, 2, 3, 4, 5].map((p) => (
              <option key={p} value={p}>part {p}</option>
            ))}
          </select>
          <select name="difficulty" defaultValue={sp.difficulty ?? ""} className={inputCls}>
            <option value="">any CEFR</option>
            {CEFR.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select name="status" defaultValue={sp.status ?? "active"} className={inputCls}>
            <option value="active">active</option>
            <option value="retired">retired</option>
            <option value="all">all</option>
          </select>
          <Button type="submit" variant="secondary">Filter</Button>
          <Link href="/dashboard/questions" className="text-[13px] text-crimson underline underline-offset-2 pb-2">
            Reset
          </Link>
        </form>

        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg">
            Questions <span className="figures text-[13px] text-ink-muted">({(questions ?? []).length})</span>
          </h2>
        </div>
        <BulkQuestionList
          questions={questions ?? []}
          bulkDelete={bulkDeleteQuestions}
          bulkSetActive={bulkSetActive}
        />
      </section>
    </div>
  );
}
