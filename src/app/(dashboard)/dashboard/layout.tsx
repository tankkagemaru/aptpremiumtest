import Link from "next/link";
import { redirect } from "next/navigation";
import { type ReactNode } from "react";
import { getProfile, isStaff } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

const NAV = [
  { n: "01", label: "Overview", href: "/dashboard" },
  { n: "02", label: "Question bank", href: "/dashboard/questions" },
  { n: "03", label: "Tests", href: "/dashboard/tests" },
  { n: "04", label: "Students", href: "/dashboard/students" },
  { n: "05", label: "Grading", href: "/dashboard/grading" },
  { n: "06", label: "Settings", href: "/dashboard/settings" },
];

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (!isStaff(profile.role)) redirect("/home");

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-line bg-cream-50">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/dashboard">
            <Logo subtitle="Mock tests · Staff" />
          </Link>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[13px] text-ink-muted hidden sm:inline">
              {profile.fullName} · {profile.role}
            </span>
            <form action="/auth/signout" method="post">
              <Button variant="secondary" type="submit">
                Sign out
              </Button>
            </form>
          </div>
        </div>
        <nav className="mx-auto max-w-6xl px-4 flex gap-6 overflow-x-auto">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="py-3 text-[14px] text-ink-soft hover:text-ink whitespace-nowrap"
            >
              <span className="figures text-ink-muted mr-1.5">{item.n}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
