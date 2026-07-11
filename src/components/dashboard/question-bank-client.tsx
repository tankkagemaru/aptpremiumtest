"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { QuestionForm } from "@/components/dashboard/question-form";
import { BulkQuestionList } from "@/components/dashboard/bulk-question-list";
import { saveQuestion } from "@/app/(dashboard)/dashboard/questions/actions";
import type { ImportQuestion } from "@/lib/question-import";

type Q = {
  id: string;
  module: string;
  part: number | null;
  question_type: string;
  prompt: string | null;
  difficulty: string | null;
  is_active: boolean;
};
type Draft = ImportQuestion & { module: string };

export function QuestionBankClient({
  activeExam,
  questions,
  totalCount,
  bulkDelete,
  bulkSetActive,
}: {
  activeExam: string;
  questions: Q[];
  totalCount: number;
  bulkDelete: (formData: FormData) => void;
  bulkSetActive: (formData: FormData) => void;
}) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [mode, setMode] = useState<null | "add" | "edit">(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [initial, setInitial] = useState<Draft | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [loadErr, setLoadErr] = useState("");

  function openAdd() {
    setInitial(null);
    setEditId(null);
    setLoadErr("");
    setMode("add");
  }

  async function openEdit(id: string) {
    setMode("edit");
    setEditId(id);
    setInitial(null);
    setLoadErr("");
    setLoadingEdit(true);
    const { data: row, error } = await supabase
      .from("mock_questions")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    setLoadingEdit(false);
    if (error || !row) {
      setLoadErr(error?.message ?? "Question not found.");
      return;
    }
    setInitial({
      module: row.module,
      question_type: row.question_type,
      part: row.part ?? undefined,
      prompt: row.prompt ?? undefined,
      passage: row.passage ?? undefined,
      media: row.media_url ?? undefined,
      options: row.options ?? undefined,
      correct_answers: row.correct_answers ?? undefined,
      points: row.points ?? undefined,
      difficulty: row.difficulty ?? undefined,
      tags: row.tags ?? undefined,
    });
  }

  function close() {
    setMode(null);
    setEditId(null);
    setInitial(null);
    setLoadErr("");
  }

  function onSaved() {
    close();
    router.refresh();
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-3 gap-3">
        <h2 className="text-lg">
          Questions{" "}
          <span className="figures text-[13px] text-ink-muted">({totalCount})</span>
        </h2>
        <Button onClick={openAdd}>+ Add question</Button>
      </div>

      <BulkQuestionList
        questions={questions}
        bulkDelete={bulkDelete}
        bulkSetActive={bulkSetActive}
        onEdit={openEdit}
      />

      {/* Add / edit wizard modal */}
      <Modal
        open={mode !== null}
        onClose={close}
        title={mode === "edit" ? "Edit question" : "Add a question"}
        subtitle={
          mode === "edit" && initial ? `${initial.module} · ${initial.question_type}` : undefined
        }
      >
        {mode === "edit" && loadingEdit ? (
          <p className="text-[14px] text-ink-muted py-8 text-center">Loading question…</p>
        ) : loadErr ? (
          <p className="rounded-md bg-alert-bg text-alert px-3 py-2 text-[13px]">{loadErr}</p>
        ) : mode === "edit" && !initial ? null : (
          <>
            {mode === "edit" && editId ? (
              <div className="mb-4 -mt-1 text-right">
                <Link
                  href={`/dashboard/questions/${editId}/preview`}
                  target="_blank"
                  className="text-[13px] text-crimson underline underline-offset-2"
                >
                  Preview as student ↗
                </Link>
              </div>
            ) : null}
            <QuestionForm
            key={editId ?? "new"}
            examCode={activeExam}
            initial={initial ?? undefined}
            questionId={editId ?? undefined}
            saveAction={saveQuestion}
            onSaved={onSaved}
            onCancel={close}
            />
          </>
        )}
      </Modal>
    </section>
  );
}
