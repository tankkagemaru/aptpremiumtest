"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";

const PAGE = "/dashboard/students";

export async function createAccount(formData: FormData) {
  const profile = await getProfile();
  if (profile?.role !== "admin") {
    redirect(`${PAGE}?error=${encodeURIComponent("Only an admin can create accounts.")}`);
  }

  const email = String(formData.get("email") ?? "").trim();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const role = String(formData.get("role") ?? "student");
  const password = String(formData.get("password") ?? "");

  if (!email || !fullName || password.length < 8) {
    redirect(
      `${PAGE}?error=${encodeURIComponent("Name, email and a password of 8+ characters are required.")}`
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
    redirect(`${PAGE}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(PAGE);
  redirect(
    `${PAGE}?created=${encodeURIComponent(`${fullName} (${role}) — they sign in with the email and password you set.`)}`
  );
}
