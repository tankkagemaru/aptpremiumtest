"use client";

import { type ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "./button";

/** Submit button that shows a pending label while the form action runs. */
export function SubmitButton({
  children,
  pendingLabel = "Working…",
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingLabel?: string;
  variant?: "primary" | "secondary" | "ghost";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} className={className} disabled={pending} {...props}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
