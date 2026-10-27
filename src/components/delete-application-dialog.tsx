"use client";

import { Modal } from "@/components/modal";

export function DeleteApplicationDialog({
  application,
  onCancel,
  onConfirm,
}: {
  application: { role: string; company: string } | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open={application !== null} onClose={onCancel} title="Delete application?">
      {application && (
        <>
          <p className="py-4">
            This permanently deletes <strong>{application.role}</strong> at{" "}
            <strong>{application.company}</strong>, including its history. This can&apos;t be
            undone.
          </p>
          <div className="modal-action">
            <form method="dialog">
              <button className="btn">Cancel</button>
            </form>
            <button type="button" className="btn btn-error" onClick={onConfirm}>
              Delete
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
