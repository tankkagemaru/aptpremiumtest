import { type InputHTMLAttributes } from "react";

export function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-md border border-line bg-paper px-3 py-2 text-[15px] text-ink placeholder:text-ink-muted focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson ${className}`}
      {...props}
    />
  );
}
