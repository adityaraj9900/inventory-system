import React, { useEffect } from "react";

export default function Modal({ title, eyebrow, onClose, children, width = "max-w-lg" }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-ink/40 px-4 py-10">
      <div className={`panel w-full ${width} animate-[fadeIn_0.12s_ease-out]`}>
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div>
            {eyebrow && (
              <p className="font-mono text-[11px] uppercase tracking-widest2 text-muted">{eyebrow}</p>
            )}
            <h2 className="font-display text-2xl font-semibold leading-none text-ink">{title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-sm p-1 text-muted hover:bg-base hover:text-ink"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>
  );
}
