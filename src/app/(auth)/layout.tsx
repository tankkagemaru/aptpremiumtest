/* eslint-disable @next/next/no-img-element */
import { type ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl grid md:grid-cols-[0.95fr_1.05fr] rounded-2xl border border-line bg-paper overflow-hidden shadow-sm">
        {/* Brand panel */}
        <div className="bg-cream-50 border-b md:border-b-0 md:border-r border-line p-10 flex flex-col justify-center gap-4 text-center md:text-left items-center md:items-start">
          <img
            src="/plc-logo.png"
            alt="Premium Language Centre"
            width={56}
            height={56}
            className="rounded-[8px]"
            style={{ width: 56, height: 56 }}
          />
          <p className="label-caps">Premium Language Centre · Mock tests</p>
          <h1 className="font-display text-5xl leading-none">
            Mock<span className="text-crimson">·</span>Test
          </h1>
          <p className="text-ink-soft text-[15px] leading-6 max-w-xs">
            Practise the UPSI - British Council APTIS — and soon IELTS, MUET and
            TOEFL — with timed, exam-style mock tests and teacher-verified CEFR
            results.
          </p>
        </div>

        {/* Form panel */}
        <div className="p-8 sm:p-10 flex items-center">
          <div className="w-full">{children}</div>
        </div>
      </div>
    </main>
  );
}
