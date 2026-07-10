import { type ReactNode } from "react";

export function Field({
  label,
  htmlFor,
  children,
  hint,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="label-caps block">
        {label}
      </label>
      {children}
      {hint ? <p className="text-[13px] text-ink-muted">{hint}</p> : null}
    </div>
  );
}
