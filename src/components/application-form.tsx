"use client";

import { useActionState, useId } from "react";
import { createApplicationAction, type FormState } from "@/app/(app)/applications/actions";

const initialState: FormState = { status: "idle" };

// The `required` attribute already tells screen readers, so the asterisk is visual only
const requiredMark = <span className="text-error" aria-hidden="true">*</span>;
const optionalMark = <span className="text-base-content/60">(optional)</span>;

export function ApplicationForm({ companies }: { companies: string[] }) {
  const [state, formAction, pending] = useActionState(createApplicationAction, initialState);
  const id = useId();
  const field = (name: string) => `${id}-${name}`;
  const value = (name: string) => state.values?.[name];

  return (
    <form action={formAction} className="max-w-xl">
      <fieldset className="fieldset gap-2" disabled={pending}>
        {state.status === "error" && (
          <div role="alert" className="alert alert-error alert-soft">
            {state.message}
          </div>
        )}

        <label className="label" htmlFor={field("company")}>Company {requiredMark}</label>
        <input
          id={field("company")}
          name="company"
          defaultValue={value("company")}
          className="input w-full"
          list={field("companies")}
          autoComplete="off"
          required
        />
        <datalist id={field("companies")}>
          {companies.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>

        <label className="label" htmlFor={field("role")}>Role {requiredMark}</label>
        <input id={field("role")} name="role"
          defaultValue={value("role")} className="input w-full" required />

        <label className="label" htmlFor={field("postingUrl")}>
          Link to the posting {requiredMark}
        </label>
        <input
          id={field("postingUrl")}
          name="postingUrl"
          defaultValue={value("postingUrl")}
          type="url"
          placeholder="https://"
          className="input w-full"
          // Every posting link is unique, so the browser's history suggestions only get in the way
          autoComplete="off"
          required
        />

        <label className="label" htmlFor={field("appliedOn")}>Date applied {optionalMark}</label>
        <input
          id={field("appliedOn")}
          name="appliedOn"
          type="date"
          className="input w-full"
          defaultValue={value("appliedOn") ?? new Date().toISOString().slice(0, 10)}
        />

        <span className="label">Salary range {optionalMark}</span>
        <div className="flex gap-2">
          <input
            name="salaryMin"
          defaultValue={value("salaryMin")}
            type="number"
            min={0}
            step={1000}
            placeholder="Min"
            aria-label="Minimum salary"
            className="input w-full"
          />
          <input
            name="salaryMax"
          defaultValue={value("salaryMax")}
            type="number"
            min={0}
            step={1000}
            placeholder="Max"
            aria-label="Maximum salary"
            className="input w-full"
          />
          <select
            // A select only takes a new defaultValue on remount
            key={value("salaryCurrency")}
            name="salaryCurrency" aria-label="Currency" className="select w-28" defaultValue={value("salaryCurrency") ?? "USD"}>
            {["USD", "EUR", "GBP", "CAD", "AUD", "MXN"].map((code) => (
              <option key={code}>{code}</option>
            ))}
          </select>
        </div>

        <label className="label" htmlFor={field("notes")}>Notes {optionalMark}</label>
        <textarea id={field("notes")} name="notes"
          defaultValue={value("notes")} rows={4} className="textarea w-full" />

        <p className="mt-2 text-sm text-base-content/70">
          Fields marked {requiredMark} are required.
        </p>

        <button type="submit" className="btn btn-primary mt-2 self-start">
          {pending && <span className="loading loading-spinner loading-sm" />}
          Save application
        </button>
      </fieldset>
    </form>
  );
}
