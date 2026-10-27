"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

// Native <dialog> gives focus trapping and Esc-to-close for free
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    dialog.showModal();
    // Also runs when Next hides this page after navigating away (it stays mounted),
    // so an open modal can't block the next page. close() fires onClose, which resets state.
    return () => dialog.close();
  }, [open]);

  return (
    <dialog ref={ref} className="modal" onClose={onClose} aria-labelledby={titleId}>
      <div className="modal-box">
        <h3 id={titleId} className="text-lg font-bold">
          {title}
        </h3>
        {children}
      </div>
      {/* Click-outside-to-close for mice; keyboard and screen readers use Esc or the buttons */}
      <form method="dialog" className="modal-backdrop" aria-hidden="true">
        <button tabIndex={-1}>Close</button>
      </form>
    </dialog>
  );
}
