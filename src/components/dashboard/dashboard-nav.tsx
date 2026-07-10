"use client";

import Link from "next/link";
import { Fragment } from "react";
import { usePathname } from "next/navigation";

// Grouped by workflow: daily work · content authoring · administration
const GROUPS: { n: string; label: string; href: string }[][] = [
  [
    { n: "01", label: "Overview", href: "/dashboard" },
    { n: "02", label: "Grading", href: "/dashboard/grading" },
  ],
  [
    { n: "03", label: "Question bank", href: "/dashboard/questions" },
    { n: "04", label: "Tests", href: "/dashboard/tests" },
  ],
  [
    { n: "05", label: "Students", href: "/dashboard/students" },
    { n: "06", label: "Settings", href: "/dashboard/settings" },
  ],
];

export function DashboardNav() {
  const path = usePathname();
  const active = (href: string) =>
    href === "/dashboard" ? path === "/dashboard" : path.startsWith(href);

  return (
    <nav className="mx-auto max-w-6xl px-4 flex items-center gap-1 overflow-x-auto">
      {GROUPS.map((group, gi) => (
        <Fragment key={gi}>
          {gi > 0 ? <span className="mx-2 h-4 w-px bg-line shrink-0" aria-hidden /> : null}
          {group.map((item) => {
            const on = active(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={on ? "page" : undefined}
                className={`py-3 px-2 text-[14px] whitespace-nowrap border-b-2 transition-colors ${
                  on
                    ? "text-crimson border-crimson"
                    : "text-ink-soft border-transparent hover:text-ink"
                }`}
              >
                <span className={`figures mr-1.5 ${on ? "text-crimson" : "text-ink-muted"}`}>
                  {item.n}
                </span>
                {item.label}
              </Link>
            );
          })}
        </Fragment>
      ))}
    </nav>
  );
}
