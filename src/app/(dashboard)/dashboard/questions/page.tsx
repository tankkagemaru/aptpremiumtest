import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MODULES, TYPE_PARTS } from "@/lib/question-import";
import { QuestionImport } from "@/components/dashboard/question-import";
import { ExamScopeBar } from "@/components/dashboard/exam-scope-bar";
import { QuestionBankClient } from "@/components/dashboard/question-bank-client";
import { bulkDeleteQuestions, bulkSetActive } from "./actions";

const CEFR = ["A1", "A2", "B1", "B2", "C1", "C2"];
const inputCls =
  "rounded-md border border-line bg-paper px-2.5 py-1.5 text-[13px] focus:outline-none focus:border-crimson";

export default async function QuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    deleted?: string;
    retired?: string;
    exam?: string;
    q?: string;
    module?: string;
    part?: string;
    difficulty?: string;
    type?: string;
    status?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  // Active exams (only these have a bank you can edit today)
  const { data: examRows } = await supabase
    .from("mock_exams")
    .select("id, code, name")
    .eq("is_active", true)
    .order("name");
  const exams = examRows ?? [];
  const activeExam = exams.find((e) => e.code === sp.exam) ?? exams[0] ?? null;
  const examId = activeExam?.id ?? null;

  // Module counts (scoped to the active exam)
  const counts = await Promise.all(
    MODULES.map(async (m) => {
      let cq = supabase
        .from("mock_questions")
        .select("id", { count: "exact", head: true })
        .eq("module", m);
      if (examId) cq = cq.eq("exam_id", examId);
      const { count } = await cq;
      return { module: m, count: count ?? 0 };
    })
  );

  // Filtered, paged list (scoped to the active exam)
  const PAGE_SIZE = 50;
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  let query = supabase
    .from("mock_questions")
    .select("id, module, part, question_type, prompt, difficulty, is_active", { count: "exact" })
    .order("module")
    .order("part")
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (examId) query = query.eq("exam_id", examId);
  if (sp.module) query = query.eq("module", sp.module);
  if (sp.part) query = query.eq("part", Number(sp.part));
  if (sp.difficulty) query = query.eq("difficulty", sp.difficulty);
  if (sp.type) query = query.eq("question_type", sp.type);
  if (sp.q) query = query.ilike("prompt", `%${sp.q}%`);
  if (sp.status === "retired") query = query.eq("is_active", false);
  else if (sp.status !== "all") query = query.eq("is_active", true);
  const { data: questions, count: totalCount } = await query;
  const totalPages = Math.max(1, Math.ceil((totalCount ?? 0) / PAGE_SIZE));

  const withParams = (over: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();
    Object.entries(sp).forEach(([k, v]) => {
      if (v) params.set(k, String(v));
    });
    Object.entries(over).forEach(([k, v]) => {
      if (v === undefined || v === "") params.delete(k);
      else params.set(k, String(v));
    });
    const s = params.toString();
    return `/dashboard/questions${s ? `?${s}` : ""}`;
  };

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
        </div>
      </div>

      {sp.error ? (
        <p className="rounded-md bg-alert-bg text-alert px-3 py-2 text-[13px]">{sp.error}</p>
      ) : null}
      {sp.deleted || sp.retired ? (
        <p className="rounded-md bg-good-bg text-good px-3 py-2 text-[13px]">
          Deleted {sp.deleted ?? 0}
          {sp.retired && sp.retired !== "0"
            ? `, retired ${sp.retired} (already had student answers)`
            : ""}
          .
        </p>
      ) : null}

      {/* Which exam are we editing? (#2) */}
      {exams.length > 0 && activeExam ? (
        <ExamScopeBar exams={exams} activeExam={activeExam.code} />
      ) : (
        <p className="rounded-md bg-pending-bg text-pending px-3 py-2 text-[13px]">
          No active exam found. Create one in the database before importing questions.
        </p>
      )}

      {/* Module cards */}
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {counts.map((c) => (
          <Link
            key={c.module}
            href={withParams({
              module: c.module,
              type: undefined,
              part: undefined,
              difficulty: undefined,
              q: undefined,
              status: undefined,
              page: undefined,
            })}
          >
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

      {/* Import with progress + logs (#1) */}
      <QuestionImport />

      {/* Filter + search */}
      <section>
        <form method="get" className="flex flex-wrap items-end gap-3 mb-4">
          {activeExam ? <input type="hidden" name="exam" value={activeExam.code} /> : null}
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
          <Link
            href={withParams({
              q: undefined,
              module: undefined,
              type: undefined,
              part: undefined,
              difficulty: undefined,
              status: undefined,
              page: undefined,
            })}
            className="text-[13px] text-crimson underline underline-offset-2 pb-2"
          >
            Reset
          </Link>
        </form>

        <QuestionBankClient
          activeExam={activeExam?.code ?? "aptis-general"}
          questions={questions ?? []}
          totalCount={totalCount ?? 0}
          bulkDelete={bulkDeleteQuestions}
          bulkSetActive={bulkSetActive}
        />

        {totalPages > 1 ? (
          <div className="flex items-center justify-center gap-3 mt-4 text-[13px]">
            {page > 1 ? (
              <Link href={withParams({ page: page - 1 })} className="rounded-md border border-line bg-paper px-3 py-1.5 hover:border-crimson">
                ← Prev
              </Link>
            ) : (
              <span className="rounded-md border border-line px-3 py-1.5 text-ink-muted opacity-50">← Prev</span>
            )}
            <span className="figures text-ink-muted">{page} / {totalPages}</span>
            {page < totalPages ? (
              <Link href={withParams({ page: page + 1 })} className="rounded-md border border-line bg-paper px-3 py-1.5 hover:border-crimson">
                Next →
              </Link>
            ) : (
              <span className="rounded-md border border-line px-3 py-1.5 text-ink-muted opacity-50">Next →</span>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}
