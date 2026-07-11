"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

type ExamOpt = { code: string; name: string };

const COMING_SOON = ["IELTS", "MUET", "TOEFL"];

/** Makes clear which exam's bank is being edited, and lets staff switch exams.
 *  Coming-soon exams are shown greyed (mirrors the student home). */
export function ExamScopeBar({
  exams,
  activeExam,
}: {
  exams: ExamOpt[];
  activeExam: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const examName = exams.find((e) => e.code === activeExam)?.name ?? activeExam;

  function selectExam(code: string) {
    if (code === activeExam) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("exam", code);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="label-caps mr-1">Exam</span>
        {exams.map((e) => {
          const on = e.code === activeExam;
          return (
            <button
              key={e.code}
              type="button"
              onClick={() => selectExam(e.code)}
              aria-current={on ? "true" : undefined}
              className={`rounded-md border px-3 py-1.5 text-[13px] cursor-pointer transition-colors ${
                on
                  ? "border-crimson bg-crimson text-paper"
                  : "border-line bg-paper text-ink-soft hover:border-crimson"
              }`}
            >
              {e.name}
            </button>
          );
        })}
        {COMING_SOON.filter((n) => !exams.some((e) => e.name.toUpperCase().includes(n))).map(
          (n) => (
            <span
              key={n}
              title="Coming soon"
              className="inline-flex items-center gap-1.5 rounded-md border border-line bg-cream-50 px-3 py-1.5 text-[13px] text-ink-muted opacity-60 select-none"
            >
              {n}
              <span className="rounded bg-paper border border-line px-1.5 py-0.5 text-[10px]">
                soon
              </span>
            </span>
          )
        )}
      </div>
      <p className="text-[12px] text-ink-muted">
        Editing the question bank for <strong>{examName}</strong> — counts, the list,
        search and import below all apply to this exam only.
      </p>
    </div>
  );
}
