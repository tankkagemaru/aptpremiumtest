import { createClient } from "@/lib/supabase/server";

export type Role = "student" | "teacher" | "admin";

export type Profile = {
  userId: string;
  email: string;
  fullName: string;
  role: Role;
  studentId: string | null;
};

export function isStaff(role: Role) {
  return role === "teacher" || role === "admin";
}

/** Current user's identity, role (from the shared public.users table) and students.id. */
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: userRow }, { data: studentRow }] = await Promise.all([
    supabase.from("users").select("role, full_name").eq("id", user.id).maybeSingle(),
    supabase.from("students").select("id").eq("user_id", user.id).maybeSingle(),
  ]);

  return {
    userId: user.id,
    email: user.email ?? "",
    fullName: userRow?.full_name ?? user.email ?? "",
    role: (userRow?.role as Role) ?? "student",
    studentId: studentRow?.id ?? null,
  };
}
