"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  addContactAction,
  updateContactAction,
  type FormState,
} from "@/app/(app)/applications/actions";

const initialState: FormState = { status: "idle" };

type ContactValues = {
  name: string;
  title: string | null;
  email: string | null;
  linkedinUrl: string | null;
};

type Contact = ContactValues & { id: string };

// Shared by the add and edit forms; `values` refills them after a server error
function ContactFields({
  applicationId,
  values,
}: {
  applicationId: string;
  values?: Partial<Record<keyof ContactValues, string | null>>;
}) {
  return (
    <>
      <input type="hidden" name="applicationId" value={applicationId} />
      <input name="name" defaultValue={values?.name ?? ""} aria-label="Name" placeholder="Name" className="input w-full" required />
      <input name="title" defaultValue={values?.title ?? ""} aria-label="Title" placeholder="Title, e.g. Recruiter" className="input w-full" />
      <input name="email" defaultValue={values?.email ?? ""} type="email" aria-label="Email" placeholder="Email" className="input w-full" />
      <input
        name="linkedinUrl"
        defaultValue={values?.linkedinUrl ?? ""}
        type="url"
        aria-label="LinkedIn profile link"
        placeholder="LinkedIn profile, e.g. https://linkedin.com/in/..."
        className="input w-full"
      />
    </>
  );
}

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
        <fieldset className="fieldset" disabled={pending}>
          {state.status === "error" && (
            <div role="alert" className="alert alert-error alert-soft">
              {state.message}
            </div>
          )}
          <ContactFields applicationId={applicationId} values={state.values} />
          <button type="submit" className="btn btn-sm mt-2 self-start">
            {pending && <span className="loading loading-spinner loading-xs" />}
            Save contact
          </button>
        </fieldset>
      </form>
    </details>
  );
}

export function ContactCard({
  applicationId,
  contact,
}: {
  applicationId: string;
  contact: Contact;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <li className="card card-sm bg-base-200">
      <div className="card-body">
        {editing ? (
          <EditContactForm
            applicationId={applicationId}
            contact={contact}
            onDone={() => setEditing(false)}
          />
        ) : (
          <>
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium">{contact.name}</p>
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                aria-label={`Edit ${contact.name}`}
                onClick={() => setEditing(true)}
              >
                Edit
              </button>
            </div>
            {contact.title && <p className="text-sm text-base-content/70">{contact.title}</p>}
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="link text-sm">
                {contact.email}
              </a>
            )}
            {contact.linkedinUrl && (
              <a href={contact.linkedinUrl} className="link text-sm" target="_blank" rel="noopener noreferrer">
                LinkedIn
              </a>
            )}
          </>
        )}
      </div>
    </li>
  );
}

function EditContactForm({
  applicationId,
  contact,
  onDone,
}: {
  applicationId: string;
  contact: Contact;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    updateContactAction.bind(null, contact.id),
    initialState,
  );

  useEffect(() => {
    // A new idle state means the save worked
    if (state !== initialState && state.status === "idle") onDone();
  }, [state, onDone]);

  return (
    <form action={formAction}>
      <fieldset className="fieldset" disabled={pending}>
        {state.status === "error" && (
          <div role="alert" className="alert alert-error alert-soft">
            {state.message}
          </div>
        )}
        <ContactFields applicationId={applicationId} values={state.values ?? contact} />
        <div className="mt-2 flex gap-2">
          <button type="submit" className="btn btn-success btn-sm">
            {pending && <span className="loading loading-spinner loading-xs" />}
            Save
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onDone}>
            Cancel
          </button>
        </div>
      </fieldset>
    </form>
  );
}
