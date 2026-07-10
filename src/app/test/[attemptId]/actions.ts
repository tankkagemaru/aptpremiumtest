"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function startSection(attemptId: string, sectionId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("mock_start_section", {
    p_attempt: attemptId,
    p_section: sectionId,
  });
  if (error) {
    redirect(`/test/${attemptId}?error=${encodeURIComponent(error.message)}`);
  }
  redirect(`/test/${attemptId}/section/${sectionId}`);
}

export async function submitSection(attemptId: string, sectionId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("mock_submit_section", {
    p_attempt: attemptId,
    p_section: sectionId,
  });
  if (error) {
    redirect(
      `/test/${attemptId}/section/${sectionId}?error=${encodeURIComponent(error.message)}`
    );
  }
  redirect(`/test/${attemptId}`);
}
