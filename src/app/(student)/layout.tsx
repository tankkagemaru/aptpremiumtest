import Link from "next/link";
import { redirect } from "next/navigation";
import { type ReactNode } from "react";
import { getProfile } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";

export default async function StudentLayout({
  children,
}: {
  children: ReactNode;
}) {
  const profile = await getProfile();
  if (!profile) redirect("/login");

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-line bg-cream-50">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/home" className="min-w-0">
            <Logo subtitle="Mock tests" />
          </Link>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-[13px] text-ink-muted hidden sm:inline">
              {profile.fullName}
            </span>
            <form action="/auth/signout" method="post">
              <Button variant="secondary" type="submit">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
