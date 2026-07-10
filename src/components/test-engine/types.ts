/** A question as students see it (from mock_questions_student — no answer keys). */
export type StudentQuestion = {
  id: string;
  module: string;
  part: number | null;
  question_type: string;
  prompt: string | null;
  passage: string | null;
  media_url: string | null;
  options: Record<string, unknown> | null;
  points: number;
  /** signed URL resolved server-side for media_url */
  signedMediaUrl?: string | null;
};

/** Saved answer shapes — must match what mock_submit_section compares against. */
export type Answer = {
  choice?: number;
  /** strings for word answers (r1, r4, vocab, l3), numbers for index answers (r3, r5, l2, l4) */
  answers?: (string | number | null)[];
  /** r2 ordering: current arrangement as original indices */
  order?: number[];
  /** writing: single text (w2) */
  text?: string;
  /** writing: multiple texts (w1 ×5, w3 ×3, w4 [informal, formal]) */
  texts?: string[];
  /** speaking: storage paths in mock-speaking, one per sub-question */
  audio_paths?: string[];
  /** audio play counts, UI bookkeeping only */
  _plays?: number;
};

/** Identity the speaking recorder needs to build its storage path. */
export type RunnerCtx = {
  attemptId: string;
  studentId: string;
};

export function countWords(text: string | undefined | null): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function answerWordCount(a: Answer): number {
  if (a.text !== undefined) return countWords(a.text);
  if (a.texts) return a.texts.reduce((sum, t) => sum + countWords(t), 0);
  return 0;
}
