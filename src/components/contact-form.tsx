"use client";

import { useActionState, useEffect, useRef } from "react";
import { addContactAction, type FormState } from "@/app/(app)/applications/actions";

const initialState: FormState = { status: "idle" };

export function ContactForm({ applicationId }: { applicationId: string }) {
  const [state, formAction, pending] = useActionState(addContactAction, initialState);
  const details = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    // Collapse again once a contact was saved
    if (state.status === "idle" && details.current) details.current.open = false;
  }, [state]);

  return (
    <details ref={details} className="collapse collapse-arrow border border-base-300">
      <summary className="collapse-title text-sm font-medium">Add a contact</summary>
      <form action={formAction} className="collapse-content">
        <input type="hidden" name="applicationId" value={applicationId} />
        <fieldset className="fieldset" disabled={pending}>
          {state.status === "error" && (
            <div role="alert" className="alert alert-error alert-soft">
              {state.message}
            </div>
          )}
          <input name="name" defaultValue={state.values?.name} aria-label="Name" placeholder="Name" className="input w-full" required />
          <input name="title" defaultValue={state.values?.title} aria-label="Title" placeholder="Title, e.g. Recruiter" className="input w-full" />
          <input name="email" defaultValue={state.values?.email} type="email" aria-label="Email" placeholder="Email" className="input w-full" />
          <input
            name="linkedinUrl"
            defaultValue={state.values?.linkedinUrl}
            type="url"
            aria-label="LinkedIn"
            placeholder="LinkedIn URL"
            className="input w-full"
          />
          <button type="submit" className="btn btn-sm mt-2 self-start">
            {pending && <span className="loading loading-spinner loading-xs" />}
            Save contact
          </button>
        </fieldset>
      </form>
    </details>
  );
}
