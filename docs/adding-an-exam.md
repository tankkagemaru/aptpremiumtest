# Multi-exam architecture & adding a new exam

The platform is **bank-first**: staff maintain a question bank per exam, and each
student attempt is **generated on demand** — a fresh, randomized test assembled
from the active bank according to the exam's **blueprint** (the "ruling"). Nobody
has to pre-build tests.

Everything is already split by `exam_id`, so adding IELTS / MUET / TOEFL is data +
(for genuinely new question shapes) renderers — no changes to the engine.

## The split (per exam)

| Piece | Where | Notes |
|---|---|---|
| Exam registry | `mock_exams` (code, name, modules, **blueprint**) | one row per exam |
| Blueprint (the ruling) | `mock_exams.blueprint` (jsonb) | modules, durations, per-part question counts |
| Question bank | `mock_questions` (`exam_id`, module, part, type) | tagged to the exam |
| Scoring bands | `mock_scoring_bands` (`exam_id`, module) | raw→scale→CEFR/band, admin-editable in Settings |
| Renderers | `components/test-engine/renderers*.tsx` | keyed by `question_type` |
| Generation | `mock_generate_attempt(exam)` | reads the blueprint, picks random questions |

## Blueprint shape

```json
{
  "modules": [
    { "module": "core", "duration_minutes": 25,
      "parts": [{ "part": 1, "count": 25 }, { "part": 2, "count": 5 }] },
    { "module": "reading", "duration_minutes": 35,
      "parts": [{ "part": 1, "count": 1 }, ... ] }
  ]
}
```

`count` = how many active questions of that module+part to draw at random per attempt.
Sections whose part has no questions are skipped automatically.

## To add a new exam (e.g. IELTS)

1. **Insert the exam** in `mock_exams`: `code` (e.g. `ielts-academic`), `name`,
   `modules` (array of module keys), and a `blueprint` matching that exam's structure
   and timings.
2. **Seed scoring bands** in `mock_scoring_bands` for the exam (its own scale, e.g.
   IELTS 0–9 bands) per module — or reuse the Settings editor once the exam exists.
3. **Author questions** in the bank tagged with the new `exam_id` (import JSON or the
   wizard). Reuse existing `question_type`s where the task shape matches.
4. **Add renderers** only for genuinely new task types (e.g. IELTS-specific formats):
   add a `question_type` to `question-import.ts` `TYPE_PARTS`, a case in the validator,
   an editor in `question-form.tsx`, and a renderer in `renderers.tsx`.
5. **Flip the panel**: the student home shows greyed "Coming soon" cards for IELTS /
   MUET / TOEFL; once an exam has a blueprint + bank, replace its coming-soon card with
   a live one (they render from `mock_exams` automatically when `is_active` + has a
   blueprint).

That's it — timers, autosave, grading, verification, reports, and AI analysis are all
exam-agnostic and work from the generated attempt.
