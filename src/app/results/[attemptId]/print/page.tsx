import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "@/components/result/print-button";
import { CefrProfile } from "@/components/result/cefr-profile";
import { SkillDescriptors } from "@/components/result/skill-descriptors";
import { type ModuleScores } from "@/lib/scoring/cefr";

export const dynamic = "force-dynamic";

const SKILLS: { key: string; label: string }[] = [
  { key: "listening", label: "Listening" },
  { key: "reading", label: "Reading" },
  { key: "speaking", label: "Speaking" },
  { key: "writing", label: "Writing" },
];

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
      "module_scores, overall_scale, overall_band, teacher_comment, verified_at, released_at, verified_by, attempt:mock_attempts(submitted_at, student:students(full_name, email, passport_id, country), test:mock_tests(title, exam:mock_exams(name)))"
    )
    .eq("attempt_id", attemptId)
    .maybeSingle();
  if (!result) notFound();

  const attempt = result.attempt as unknown as {
    submitted_at: string | null;
    student: { full_name: string; email: string; passport_id: string | null; country: string | null } | null;
    test: { title: string; exam: { name: string } | null } | null;
  } | null;

  let verifierName = "";
  if (result.verified_by) {
    const { data: v } = await supabase.from("users").select("full_name").eq("id", result.verified_by).maybeSingle();
    verifierName = v?.full_name ?? "";
  }

  const scores = result.module_scores as ModuleScores;
  const student = attempt?.student;
  const test = attempt?.test;

  const presentSkills = SKILLS.filter((s) => scores[s.key]);
  const finalScale = presentSkills.reduce((sum, s) => sum + (scores[s.key]?.scale ?? 0), 0);
  const finalMax = presentSkills.length * 50;

  // bar-chart rows: the 4 skills + overall
  const profile = [
    ...presentSkills.map((s) => ({ label: s.label, band: scores[s.key].band })),
    { label: "Overall", band: result.overall_band ?? "A0" },
  ];

  const dateFmt = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString("en-GB") : "—";

  return (
    <main className="min-h-full bg-paper print:bg-white text-ink">
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="flex justify-end mb-4">
          <PrintButton />
        </div>

        {/* Page 1 — report */}
        <section className="print-avoid-break">
          <header className="flex items-start justify-between border-b-2 border-crimson pb-4 mb-6">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/plc-logo.png" alt="PLC" width={48} height={48} style={{ width: 48, height: 48 }} className="rounded-[6px]" />
              <div>
                <p className="label-caps print-accent">Premium Language Centre</p>
                <p className="font-display text-xl leading-tight">
                  Mock<span className="text-crimson">·</span>Test
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl">Candidate report</p>
              <p className="text-[12px] text-ink-muted">{test?.exam?.name ?? "APTIS General"}</p>
            </div>
          </header>

          {/* Candidate details */}
          <div className="grid grid-cols-3 gap-x-6 gap-y-4 mb-8 text-[14px]">
            <Detail label="Candidate name" value={student?.full_name ?? "—"} />
            <Detail label="Test date" value={dateFmt(attempt?.submitted_at)} />
            <Detail label="Enrolment ID" value={attemptId.slice(0, 8).toUpperCase()} />
            <Detail label="Organisation" value="Premium Language Centre" />
            <Detail label="Test package" value={test?.title ?? test?.exam?.name ?? "—"} />
            <Detail
              label="ID"
              value={student?.passport_id ? `Passport · ${student.passport_id}` : student?.email ?? "—"}
            />
          </div>

          {/* Scores box */}
          <div className="grid md:grid-cols-2 gap-6 border-2 border-good rounded-card p-5 mb-6 print-avoid-break">
            <div>
              <p className="label-caps mb-2" style={{ color: "var(--good)" }}>Scale score</p>
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="border-b border-line">
                    <th className="text-left py-1.5 font-medium">Skill name</th>
                    <th className="text-right py-1.5 font-medium">Skill score</th>
                  </tr>
                </thead>
                <tbody>
                  {SKILLS.map((s) => (
                    <tr key={s.key} className="border-b border-line">
                      <td className="py-1.5">{s.label}</td>
                      <td className="py-1.5 text-right figures">
                        {scores[s.key] ? `${scores[s.key].scale}/50` : "—"}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-b border-line font-medium">
                    <td className="py-1.5">Final Scale Score</td>
                    <td className="py-1.5 text-right figures">
                      {Math.round(finalScale)}/{finalMax || 200}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1.5">Grammar and Vocabulary</td>
                    <td className="py-1.5 text-right figures">
                      {scores.core ? `${scores.core.scale}/50` : "—"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <p className="label-caps mb-2" style={{ color: "var(--good)" }}>CEFR skill profile</p>
              <CefrProfile rows={profile} />
            </div>
          </div>

          {result.teacher_comment ? (
            <div className="mb-6 print-avoid-break">
              <p className="label-caps mb-1">Examiner comment</p>
              <p className="text-[14px] leading-6 whitespace-pre-wrap">{result.teacher_comment}</p>
            </div>
          ) : null}

          <footer className="border-t border-line pt-4 flex items-end justify-between text-[12px]">
            <div>
              <p className="label-caps">Verified by</p>
              <p className="text-[13px]">{verifierName || "—"}</p>
              <p className="figures text-ink-muted">{dateFmt(result.released_at)}</p>
            </div>
            <p className="text-ink-muted max-w-xs text-right">
              Practice result — indicative CEFR estimate, not an official APTIS result.
            </p>
          </footer>
        </section>

        {/* Page 2 — descriptors */}
        <section className="mt-10 print:break-before-page">
          <SkillDescriptors />
        </section>
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-line pb-1">
      <p className="text-[14px] font-medium break-words">{value}</p>
      <p className="label-caps">{label}</p>
    </div>
  );
}
