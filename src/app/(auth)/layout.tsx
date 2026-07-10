import { type ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="label-caps mb-2">Premium Language Centre</p>
          <h1 className="text-3xl">Mock tests</h1>
        </div>
        {children}
      </div>
    </main>
  );
}
