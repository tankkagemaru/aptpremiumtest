"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Q = {
  id: string;
  module: string;
  part: number | null;
  question_type: string;
  prompt: string | null;
  difficulty: string | null;
  is_active: boolean;
};

export function BulkQuestionList({
  questions,
  bulkDelete,
  bulkSetActive,
}: {
  questions: Q[];
  bulkDelete: (formData: FormData) => void;
  bulkSetActive: (formData: FormData) => void;
}) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const allChecked = questions.length > 0 && sel.size === questions.length;

  const toggle = (id: string) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const toggleAll = () =>
    setSel(allChecked ? new Set() : new Set(questions.map((q) => q.id)));

  if (questions.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-[14px] text-ink-muted">No questions match.</p>
      </Card>
    );
  }

  return (
    <form>
      {/* selected ids travel with the form */}
      {[...sel].map((id) => (
        <input key={id} type="hidden" name="ids" value={id} />
      ))}

      <div className="flex flex-wrap items-center gap-3 mb-3">
        <label className="flex items-center gap-2 text-[13px] cursor-pointer">
          <input type="checkbox" checked={allChecked} onChange={toggleAll} className="accent-[var(--crimson)]" />
          Select all ({questions.length})
        </label>
        <span className="figures text-[13px] text-ink-muted">{sel.size} selected</span>
        <div className="flex gap-2 ml-auto">
          <Button
            type="submit"
            formAction={bulkSetActive}
            name="active"
            value="false"
            variant="secondary"
            disabled={sel.size === 0}
            className="!py-1.5 text-[13px]"
          >
            Retire
          </Button>
          <Button
            type="submit"
            formAction={bulkSetActive}
            name="active"
            value="true"
            variant="secondary"
            disabled={sel.size === 0}
            className="!py-1.5 text-[13px]"
          >
            Restore
          </Button>
          <Button
            type="submit"
            formAction={bulkDelete}
            disabled={sel.size === 0}
            className="!py-1.5 text-[13px] bg-alert"
            onClick={(e) => {
              if (!confirm(`Delete ${sel.size} question(s)? Questions with student answers are retired instead.`))
                e.preventDefault();
            }}
          >
            Delete
          </Button>
        </div>
      </div>

      <Card className="divide-y divide-line overflow-x-auto">
        {questions.map((q) => (
          <div
            key={q.id}
            className={`px-4 py-3 flex items-center gap-3 ${sel.has(q.id) ? "bg-crimson-bg/40" : ""}`}
          >
            <input
              type="checkbox"
              checked={sel.has(q.id)}
              onChange={() => toggle(q.id)}
              className="accent-[var(--crimson)] shrink-0"
            />
            <span className="figures text-[12px] text-ink-muted w-24 shrink-0">
              {q.module} · P{q.part}
            </span>
            <span className="text-[13px] text-ink-soft w-36 shrink-0">{q.question_type}</span>
            <Link
              href={`/dashboard/questions/${q.id}/edit`}
              className="text-[14px] flex-1 min-w-48 truncate hover:text-crimson hover:underline underline-offset-2"
            >
              {q.prompt ?? "—"}
            </Link>
            <span className="figures text-[12px] text-ink-muted w-8 shrink-0">
              {q.difficulty ?? ""}
            </span>
            {!q.is_active ? (
              <span className="rounded bg-pending-bg text-pending px-2 py-0.5 text-[11px] shrink-0">
                retired
              </span>
            ) : null}
          </div>
        ))}
      </Card>
    </form>
  );
}
