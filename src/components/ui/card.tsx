import { type HTMLAttributes } from "react";

// Flat card: hairline border, no shadow (shadows are reserved for modals/popovers)
export function Card({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`bg-paper border border-line rounded-card ${className}`}
      {...props}
    />
  );
}
