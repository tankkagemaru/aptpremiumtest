"use server";

import { createClient } from "@/lib/supabase/server";

/** Persist a manually-uploaded speaking photo path onto a question.
 *  (The file itself is uploaded to mock-media by the browser client;
 *  this only records the path, mirroring what /api/image does after
 *  generating.) Staff only. */
export async function setSpeakingImage(
  questionId: string,
  index: number,
  path: string
): Promise<{ ok?: true; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data: userRow } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (!userRow || !["teacher", "admin"].includes(userRow.role)) {
    return { error: "Staff only." };
  }

  const { data: q } = await supabase
    .from("mock_questions")
    .select("id, module, question_type, options")
    .eq("id", questionId)
    .maybeSingle();
  if (!q || q.module !== "speaking") return { error: "Not a speaking question." };

  if (q.question_type === "s3_compare") {
    const options = (q.options ?? {}) as Record<string, unknown>;
    const images = [...((options.images as string[]) ?? ["", ""])];
    images[index] = path;
    const { error } = await supabase
      .from("mock_questions")
      .update({ options: { ...options, images } })
      .eq("id", questionId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("mock_questions")
      .update({ media_url: path })
      .eq("id", questionId);
    if (error) return { error: error.message };
  }
  return { ok: true };
}
