import { type ReactNode } from "react";
import { Logo } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center gap-3">
          <Logo size="lg" />
          <p className="label-caps">Mock test platform</p>
        </div>
        {children}
      </div>
    </main>
  );
}
