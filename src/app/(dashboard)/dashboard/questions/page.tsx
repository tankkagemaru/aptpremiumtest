import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MediaUpload } from "@/components/dashboard/media-upload";
import { MODULES } from "@/lib/question-import";
import {
  importQuestions,
  toggleQuestionActive,
  deleteQuestion,
} from "./actions";

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    imported?: string;
    module?: string;
  }>;
}) {
  const { error, imported, module: moduleFilter } = await searchParams;
  const supabase = await createClient();

  const counts = await Promise.all(
    MODULES.map(async (m) => {
      const { count } = await supabase
        .from("mock_questions")
        .select("id", { count: "exact", head: true })
        .eq("module", m);
      return { module: m, count: count ?? 0 };
    })
  );

  let query = supabase
    .from("mock_questions")
    .select("id, module, part, question_type, prompt, difficulty, is_active, created_at")
    .order("created_at", { ascending: false })
    .limit(30);
  if (moduleFilter && (MODULES as readonly string[]).includes(moduleFilter)) {
    query = query.eq("module", moduleFilter);
  }
  const { data: questions } = await query;

  return (
    <div className="space-y-8">
      <div>
        <p className="label-caps mb-2">02 · Question bank</p>
        <h1 className="text-2xl">Question bank</h1>
      </div>

      {error ? (
        <p className="rounded-md bg-alert-bg text-alert px-3 py-2 text-[13px]">
          {error}
        </p>
      ) : null}
      {imported ? (
        <p className="rounded-md bg-good-bg text-good px-3 py-2 text-[13px]">
          Imported {imported} question{imported === "1" ? "" : "s"}.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {counts.map((c) => (
          <a key={c.module} href={`/dashboard/questions?module=${c.module}`}>
            <Card
              className={`p-4 hover:border-crimson transition-colors ${
                moduleFilter === c.module ? "border-crimson" : ""
              }`}
            >
              <p className="figures text-2xl font-display">{c.count}</p>
              <p className="label-caps mt-1">{c.module}</p>
            </Card>
          </a>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg mb-1">Import questions</h2>
          <p className="text-[13px] text-ink-muted mb-4">
            Upload a .json file in the import format (see{" "}
            <code className="figures text-[12px]">docs/question-import-format.md</code>
            ). The file is validated before anything is saved.
          </p>
          <form action={importQuestions} className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              name="file"
              accept=".json,application/json"
              required
              className="text-[13px] text-ink-soft file:mr-3 file:rounded-md file:border file:border-line file:bg-paper file:px-3 file:py-1.5 file:text-ink"
            />
            <Button type="submit">Import</Button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg mb-1">Upload media</h2>
          <p className="text-[13px] text-ink-muted mb-4">
            Listening audio and speaking photos go to secure storage. Reference
            the shown path in your question JSON.
          </p>
          <MediaUpload />
        </Card>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg">
            {moduleFilter ? `Latest — ${moduleFilter}` : "Latest questions"}
          </h2>
          {moduleFilter ? (
            <a
              href="/dashboard/questions"
              className="text-[13px] text-crimson underline underline-offset-2"
            >
              Show all
            </a>
          ) : null}
        </div>
        {(questions ?? []).length === 0 ? (
          <Card className="p-6">
            <p className="text-[14px] text-ink-muted">
              No questions yet — import a JSON file above to get started.
            </p>
          </Card>
        ) : (
          <Card className="divide-y divide-line overflow-x-auto">
            {(questions ?? []).map((q) => (
              <div key={q.id} className="px-4 py-3 flex items-center gap-4">
                <span className="figures text-[12px] text-ink-muted w-24 shrink-0">
                  {q.module} · P{q.part}
                </span>
                <span className="text-[13px] text-ink-soft w-36 shrink-0">
                  {q.question_type}
                </span>
                <span className="text-[14px] flex-1 min-w-48 truncate">
                  {q.prompt ?? "—"}
                </span>
                <span className="figures text-[12px] text-ink-muted w-8 shrink-0">
                  {q.difficulty ?? ""}
                </span>
                {!q.is_active ? (
                  <span className="rounded bg-pending-bg text-pending px-2 py-0.5 text-[11px] shrink-0">
                    retired
                  </span>
                ) : null}
                <form action={toggleQuestionActive} className="shrink-0">
                  <input type="hidden" name="id" value={q.id} />
                  <input type="hidden" name="active" value={String(q.is_active)} />
                  <Button variant="ghost" type="submit" className="!px-2 !py-1 text-[12px]">
                    {q.is_active ? "Retire" : "Restore"}
                  </Button>
                </form>
                <form action={deleteQuestion} className="shrink-0">
                  <input type="hidden" name="id" value={q.id} />
                  <Button variant="ghost" type="submit" className="!px-2 !py-1 text-[12px] text-alert">
                    Delete
                  </Button>
                </form>
              </div>
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}
