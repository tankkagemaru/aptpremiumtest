import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { startSection } from "./actions";

const MODULE_LABELS: Record<string, string> = {
  core: "Core — Grammar & Vocabulary",
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
  speaking: "Speaking",
};

export default async function AttemptGateway({
  params,
  searchParams,
}: {
  params: Promise<{ attemptId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { attemptId } = await params;
  const { error } = await searchParams;
  const profile = await getProfile();
  if (!profile) redirect("/login");

  const supabase = await createClient();
  const { data: attempt } = await supabase
    .from("mock_attempts")
    .select("id, test_id, status, current_section, section_deadlines, test:mock_tests(title)")
    .eq("id", attemptId)
    .maybeSingle();
  if (!attempt) notFound();

  const { data: ordered } = await supabase.rpc("mock_ordered_sections", {
    p_test: attempt.test_id,
  });
  const sections = (ordered ?? []) as {
    section_id: string;
    idx: number;
    module: string;
    duration_seconds: number;
  }[];

  const finished = attempt.status !== "in_progress";
  const deadlines = (attempt.section_deadlines ?? {}) as Record<string, string>;

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-10">
      <p className="label-caps mb-2">
        {(attempt.test as unknown as { title: string } | null)?.title}
      </p>
      <h1 className="text-2xl mb-6">
        {finished ? "Test submitted" : "Your test"}
      </h1>

      {error ? (
        <p className="mb-4 rounded-md bg-alert-bg text-alert px-3 py-2 text-[13px]">{error}</p>
      ) : null}

      {finished ? (
        <Card className="p-6 space-y-4">
          <p className="text-[15px]">
            {attempt.status === "grading"
              ? "Your answers are in. Writing and speaking will be checked by a teacher — your result will appear once it has been verified and released."
              : "Your answers are in. Your result will appear once it has been verified and released by a teacher."}
          </p>
          <Link href="/home">
            <Button variant="secondary">Back to home</Button>
          </Link>
        </Card>
      ) : (
        <Card className="divide-y divide-line">
          {sections.map((s) => {
            const state =
              s.idx < attempt.current_section
                ? "done"
                : s.idx === attempt.current_section
                  ? "current"
                  : "locked";
            const started = Boolean(deadlines[s.section_id]);
            return (
              <div key={s.section_id} className="px-4 py-4 flex items-center gap-4">
                <span className="figures text-[13px] text-ink-muted w-8">
                  {String(s.idx + 1).padStart(2, "0")}
                </span>
                <div className="flex-1">
                  <p className="text-[15px]">{MODULE_LABELS[s.module] ?? s.module}</p>
                  <p className="figures text-[12px] text-ink-muted">
                    {Math.round(s.duration_seconds / 60)} minutes
                  </p>
                </div>
                {state === "done" ? (
                  <span className="rounded bg-good-bg text-good px-2 py-0.5 text-[11px]">
                    completed
                  </span>
                ) : state === "locked" ? (
                  <span className="rounded bg-cream-50 text-ink-muted px-2 py-0.5 text-[11px] border border-line">
                    locked
                  </span>
                ) : (
                  <form
                    action={async () => {
                      "use server";
                      await startSection(attemptId, s.section_id);
                    }}
                  >
                    <Button type="submit">
                      {started ? "Resume section" : "Begin section"}
                    </Button>
                  </form>
                )}
              </div>
            );
          })}
        </Card>
      )}

      {!finished ? (
        <p className="mt-4 text-[13px] text-ink-muted">
          The timer for a section starts when you begin it and keeps running even
          if you close the page. You cannot return to a submitted section.
        </p>
      ) : null}
    </main>
  );
}
