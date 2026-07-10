"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";

const PAGE = "/dashboard/students";

/** Delete a student's test attempt (cascades responses, grades, result). */
export async function deleteAttempt(formData: FormData) {
  const attemptId = String(formData.get("attempt_id"));
  const studentId = String(formData.get("student_id"));
  const supabase = await createClient();
  const { error } = await supabase.from("mock_attempts").delete().eq("id", attemptId);
  const dest = `${PAGE}/${studentId}`;
  if (error) {
    redirect(`${dest}?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath(dest);
  redirect(`${dest}?removed=1`);
}

const SETTINGS = "/dashboard/settings";

export async function createAccount(formData: FormData) {
  const profile = await getProfile();
  if (profile?.role !== "admin") {
    redirect(`${SETTINGS}?error=${encodeURIComponent("Only an admin can create accounts.")}`);
  }

  const email = String(formData.get("email") ?? "").trim();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "student");
  const password = String(formData.get("password") ?? "");

  if (!email || !fullName || password.length < 8) {
    redirect(
      `${SETTINGS}?error=${encodeURIComponent("Name, email and a password of 8+ characters are required.")}`
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("mock_admin_create_user", {
    p_email: email,
    p_password: password,
    p_full_name: fullName,
    p_role: role,
  });

  if (error) {
    redirect(`${SETTINGS}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(SETTINGS);
  redirect(
    `${SETTINGS}?created=${encodeURIComponent(`${fullName} (${role}) — they sign in with the email and password you set.`)}`
  );
}
