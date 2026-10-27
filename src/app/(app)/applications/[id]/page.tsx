import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { ContactForm } from "@/components/contact-form";
import { DeleteApplicationButton } from "@/components/delete-application-button";
import { getApplication } from "@/db/queries";
import { formatDate, formatSalary } from "@/utils/format";
import { STAGE_LABELS } from "@/utils/stages";
import { getCurrentUser } from "@/utils/session";

export const metadata: Metadata = {
  title: "Application",
};

export default function ApplicationPage({ params }: PageProps<"/applications/[id]">) {
  return (
    <>
      <Link href="/board" className="link text-sm">
        &larr; Back to board
      </Link>
      <Suspense fallback={<span className="loading loading-spinner mt-6" aria-label="Loading" />}>
        <ApplicationDetails params={params} />
      </Suspense>
    </>
  );
}

async function ApplicationDetails({ params }: Pick<PageProps<"/applications/[id]">, "params">) {
  const { id } = await params;
  const user = await getCurrentUser();
  // A malformed id would make Postgres throw on the uuid cast
  const app = z.uuid().safeParse(id).success ? await getApplication(user.id, id) : undefined;
  if (!app) notFound();

  const salary = formatSalary(app.salaryMin, app.salaryMax, app.salaryCurrency);

  return (
    <div className="mt-2 grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-semibold">{app.role}</h1>
          <div className="flex gap-2">
            <Link href={`/applications/${app.id}/edit`} className="btn btn-info btn-sm">
              Edit
            </Link>
            <DeleteApplicationButton id={app.id} role={app.role} company={app.company.name} />
          </div>
        </div>
        <p className="text-lg text-base-content/70">{app.company.name}</p>
        <span className="badge mt-2">{STAGE_LABELS[app.stage]}</span>

        <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="font-medium">Applied</dt>
          <dd>{app.appliedOn ? formatDate(app.appliedOn) : "—"}</dd>
          <dt className="font-medium">Salary</dt>
          <dd>{salary ?? "—"}</dd>
          <dt className="font-medium">Posting</dt>
          <dd className="break-all">
            {app.postingUrl ? (
              <a href={app.postingUrl} className="link" target="_blank" rel="noopener noreferrer">
                {app.postingUrl}
              </a>
            ) : (
              "—"
            )}
          </dd>
        </dl>

        {app.notes && (
          <section className="mt-6">
            <h2 className="mb-2 font-semibold">Notes</h2>
            <p className="whitespace-pre-wrap text-sm">{app.notes}</p>
          </section>
        )}

        <section className="mt-6">
          <h2 className="mb-2 font-semibold">History</h2>
          <ul className="timeline timeline-vertical timeline-compact">
            {app.stageEvents.map((event, index) => (
              <li key={event.id}>
                {index > 0 && <hr />}
                <div className="timeline-start text-xs text-base-content/60">
                  {formatDate(event.changedAt)}
                </div>
                <div className="timeline-middle">
                  <span className="block size-2 rounded-full bg-accent" />
                </div>
                <div className="timeline-end timeline-box text-sm">
                  {event.fromStage
                    ? `Moved from ${STAGE_LABELS[event.fromStage]} to ${STAGE_LABELS[event.toStage]}`
                    : "Added as Applied"}
                </div>
                {index < app.stageEvents.length - 1 && <hr />}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <aside>
        <h2 className="mb-2 font-semibold">Contacts</h2>
        <ul className="mb-4 flex flex-col gap-2">
          {app.contacts.length === 0 && (
            <li className="text-sm text-base-content/60">No contacts yet.</li>
          )}
          {app.contacts.map(({ contact }) => (
            <li key={contact.id} className="card card-sm bg-base-200">
              <div className="card-body">
                <p className="font-medium">{contact.name}</p>
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
              </div>
            </li>
          ))}
        </ul>
        <ContactForm applicationId={app.id} />
      </aside>
    </div>
  );
}
