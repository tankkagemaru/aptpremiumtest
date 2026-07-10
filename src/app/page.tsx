import { redirect } from "next/navigation";
import { getProfile, isStaff } from "@/lib/auth";

export default async function Home() {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  redirect(isStaff(profile.role) ? "/dashboard" : "/home");
}
