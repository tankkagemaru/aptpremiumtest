import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ScoreTable } from "@/components/result/score-table";
import { PrintButton } from "@/components/result/print-button";
import { CEFR_LABEL, type ModuleScores } from "@/lib/scoring/cefr";

export default async function PrintReport({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const supabase = await createClient();

  const { data: result } = await supabase
    .from("mock_results")
    .select(
      "module_scores, overall_scale, overall_band, teacher_comment, verified_at, released_at, verified_by, attempt:mock_attempts(submitted_at, student:students(full_name, email), test:mock_tests(title, exam:mock_exams(name)))"
    )
    .eq("attempt_id", attemptId)
    .maybeSingle();
  if (!result) notFound();

  const attempt = result.attempt as unknown as {
    submitted_at: string | null;
    student: { full_name: string; email: string } | null;
    test: { title: string; exam: { name: string } | null } | null;
  } | null;

  let verifierName = "";
  if (result.verified_by) {
    const { data: verifier } = await supabase
      .from("users")
      .select("full_name")
      .eq("id", result.verified_by)
      .maybeSingle();
    verifierName = verifier?.full_name ?? "";
  }

  const scores = result.module_scores as ModuleScores;
  const student = attempt?.student;
  const test = attempt?.test;

  return (
    <main className="min-h-full bg-paper print:bg-white">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="flex justify-end mb-6">
          <PrintButton />
        </div>

        <div className="border border-line rounded-card p-8 print:border-0 print:p-0 print-avoid-break">
          {/* Letterhead */}
          <header className="text-center border-b border-line pb-5 mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/plc-logo.png"
              alt="Premium Language Centre"
              width={48}
              height={48}
              className="mx-auto mb-2 rounded-[6px]"
              style={{ width: 48, height: 48 }}
            />
            <p className="label-caps print-accent">Premium Language Centre</p>
            <h1 className="font-display text-2xl mt-1">Mock test score report</h1>
            <p className="text-[13px] text-ink-muted mt-1">
              {test?.exam?.name ?? "APTIS General"} · {test?.title}
            </p>
          </header>

          {/* Candidate */}
          <section className="grid grid-cols-2 gap-3 text-[14px] mb-6">
            <div>
              <p className="label-caps">Candidate</p>
              <p>{student?.full_name}</p>
            </div>
            <div>
              <p className="label-caps">Email</p>
              <p className="break-all">{student?.email}</p>
            </div>
            <div>
              <p className="label-caps">Test date</p>
              <p className="figures">
                {attempt?.submitted_at
                  ? new Date(attempt.submitted_at).toLocaleDateString("en-GB")
                  : "—"}
              </p>
            </div>
            <div>
              <p className="label-caps">Report issued</p>
              <p className="figures">
                {result.released_at
                  ? new Date(result.released_at).toLocaleDateString("en-GB")
                  : "—"}
              </p>
            </div>
          </section>

          {/* Overall */}
          <section className="text-center border border-line rounded-card py-5 mb-6 print-avoid-break">
            <p className="label-caps">Overall CEFR level</p>
            <p className="figures font-display text-5xl print-accent">{result.overall_band}</p>
            <p className="text-[13px] text-ink-muted mt-1">
              {CEFR_LABEL[result.overall_band ?? ""] ?? ""} ·{" "}
              <span className="figures">{result.overall_scale}</span>/50
            </p>
          </section>

          {/* Modules */}
          <section className="mb-6 print-avoid-break">
            <ScoreTable scores={scores} />
          </section>

          {result.teacher_comment ? (
            <section className="mb-6 print-avoid-break">
              <p className="label-caps mb-1">Examiner comment</p>
              <p className="text-[14px] leading-6 whitespace-pre-wrap">
                {result.teacher_comment}
              </p>
            </section>
          ) : null}

          {/* Verification */}
          <footer className="border-t border-line pt-5 mt-8 flex items-end justify-between">
            <div>
              <p className="label-caps">Verified by</p>
              <p className="text-[14px]">{verifierName || "—"}</p>
              <p className="figures text-[12px] text-ink-muted">
                {result.verified_at
                  ? new Date(result.verified_at).toLocaleString("en-GB")
                  : ""}
              </p>
            </div>
            <div className="text-right">
              <div className="w-44 border-b border-ink mb-1"></div>
              <p className="label-caps">Signature</p>
            </div>
          </footer>

          <p className="text-[11px] text-ink-muted text-center mt-6">
            Practice result. Scale scores use provisional band boundaries and are
            indicative only — not an official APTIS result.
          </p>
        </div>
      </div>
    </main>
  );
}
