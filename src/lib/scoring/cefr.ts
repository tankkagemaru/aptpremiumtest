/** Display helpers for CEFR bands (mapping itself lives in the database). */

export const CEFR_ORDER = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"] as const;

export const CEFR_LABEL: Record<string, string> = {
  A0: "Beginner (below A1)",
  A1: "Breakthrough",
  A2: "Elementary",
  B1: "Intermediate",
  B2: "Upper intermediate",
  C1: "Advanced",
  C2: "Proficient",
};

export const MODULE_LABEL: Record<string, string> = {
  core: "Core — Grammar & Vocabulary",
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
  speaking: "Speaking",
};

export type ModuleScore = { scale: number; band: string };
export type ModuleScores = Record<string, ModuleScore>;
