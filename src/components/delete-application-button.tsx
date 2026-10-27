"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteApplicationAction } from "@/app/(app)/applications/actions";
import { DeleteApplicationDialog } from "@/components/delete-application-dialog";

export function DeleteApplicationButton({
  id,
  role,
  company,
}: {
  id: string;
  role: string;
  company: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirmDelete() {
    setConfirming(false);
    startTransition(async () => {
      try {
        await deleteApplicationAction(id);
        toast.success("Application deleted.");
        router.push("/board");
      } catch {
        toast.error("Couldn't delete the application. Please try again.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-error btn-outline btn-sm"
        disabled={pending}
        onClick={() => setConfirming(true)}
      >
        {pending && <span className="loading loading-spinner loading-xs" />}
        Delete
      </button>
      <DeleteApplicationDialog
        application={confirming ? { role, company } : null}
        onCancel={() => setConfirming(false)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
