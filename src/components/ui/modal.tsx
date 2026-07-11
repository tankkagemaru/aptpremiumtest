"use client";

import { useEffect, useRef } from "react";

/** Accessible overlay dialog. Closes on Escape / backdrop click. */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "max-w-3xl",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // lock background scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 flex items-start justify-center p-4 overflow-y-auto"
      onMouseDown={(e) => {
        // only close when the backdrop itself is pressed
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full ${maxWidth} my-8 rounded-card border border-line bg-paper shadow-lg`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 py-4 sticky top-0 bg-paper rounded-t-card z-10">
          <div>
            <h2 className="text-lg">{title}</h2>
            {subtitle ? (
              <p className="figures text-[12px] text-ink-muted mt-0.5">{subtitle}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-md px-2 py-1 text-ink-muted hover:bg-cream-50 hover:text-ink cursor-pointer text-[18px] leading-none"
          >
            ×
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
