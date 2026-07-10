import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost";

const variants: Record<Variant, string> = {
  // Crimson is a spice: reserved for the primary action
  primary:
    "bg-crimson text-paper hover:bg-crimson-soft border border-transparent",
  secondary: "bg-paper text-ink border border-line hover:bg-cream-50",
  ghost: "bg-transparent text-ink-soft hover:text-ink border border-transparent",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-[15px] font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
