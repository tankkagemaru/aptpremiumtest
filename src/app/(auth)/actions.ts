"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent("Invalid email or password.")}`);
  }
  redirect("/");
}

export async function register(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const registrationCode = String(formData.get("registration_code") ?? "").trim();

  if (!fullName || !email || !password || !registrationCode) {
    redirect(`/register?error=${encodeURIComponent("All fields are required.")}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // The shared signup trigger consumes registration_code and rejects
      // the signup when the code is invalid, expired or exhausted.
      data: { full_name: fullName, registration_code: registrationCode },
    },
  });

  if (error) {
    const message = /database error/i.test(error.message)
      ? "That registration code is invalid, expired or fully used. Please check with your teacher."
      : error.message;
    redirect(`/register?error=${encodeURIComponent(message)}`);
  }

  if (data.session && data.user) {
    // Provision the same identity rows the placement test creates at signup.
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("id", data.user.id)
      .maybeSingle();
    if (!existingUser) {
      await supabase.from("users").insert({
        id: data.user.id,
        email,
        role: "student",
        full_name: fullName,
      });
    }

    const { data: existingStudent } = await supabase
      .from("students")
      .select("id")
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (!existingStudent) {
      await supabase.from("students").insert({
        user_id: data.user.id,
        email,
        full_name: fullName,
      });
    }

    redirect("/home");
  }

  redirect(
    `/login?message=${encodeURIComponent("Check your email to confirm your account, then sign in.")}`
  );
}
