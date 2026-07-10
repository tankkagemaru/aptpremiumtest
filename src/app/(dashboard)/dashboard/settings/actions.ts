"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";

const SETTINGS = "/dashboard/settings";

/** Admin: update the min/max scale boundaries of scoring bands. */
export async function updateScoringBands(formData: FormData) {
  const profile = await getProfile();
  if (profile?.role !== "admin") {
    redirect(`${SETTINGS}?error=${encodeURIComponent("Only an admin can edit scoring bands.")}`);
  }

  const ids = new Set<string>();
  for (const key of formData.keys()) {
    const m = key.match(/^min_(.+)$/);
    if (m) ids.add(m[1]);
  }

  const supabase = await createClient();
  let updated = 0;
  for (const id of ids) {
    const min = Number(formData.get(`min_${id}`));
    const max = Number(formData.get(`max_${id}`));
    if (Number.isNaN(min) || Number.isNaN(max) || max < min) continue;
    const { error } = await supabase
      .from("mock_scoring_bands")
      .update({ min_scale: min, max_scale: max })
      .eq("id", Number(id));
    if (!error) updated += 1;
  }

  revalidatePath(SETTINGS);
  redirect(`${SETTINGS}?bands=${updated}`);
}
