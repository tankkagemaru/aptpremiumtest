"use client";

import { useState } from "react";
import { QuestionRenderer } from "@/components/test-engine/renderers";
import type { Answer, StudentQuestion } from "@/components/test-engine/types";

/** Renders a question exactly as a student sees it, with throwaway local state. */
export function QuestionPreview({ q }: { q: StudentQuestion }) {
  const [value, setValue] = useState<Answer>({});
  return (
    <div>
      {q.prompt ? <h2 className="text-lg font-medium mb-3">{q.prompt}</h2> : null}
      {q.passage && !q.question_type.startsWith("l") && !q.passage.includes("[[") ? (
        <p className="mb-3 text-[15px] leading-7 whitespace-pre-wrap rounded-card border border-line bg-cream-50 p-4">
          {q.passage}
        </p>
      ) : null}
      <QuestionRenderer
        q={q}
        value={value}
        onChange={setValue}
        ctx={{ attemptId: "preview", studentId: "preview" }}
      />
    </div>
  );
}
