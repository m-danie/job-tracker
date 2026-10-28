import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { ApplicationForm } from "@/components/application-form";
import { getApplication, getCompanyNames } from "@/db/queries";
import { getCurrentUser } from "@/utils/session";

export const metadata: Metadata = {
  title: "Edit application",
};

export default function EditApplicationPage({ params }: PageProps<"/applications/[id]/edit">) {
  return (
    <Suspense fallback={<span className="loading loading-spinner" aria-label="Loading" />}>
      <EditForm params={params} />
    </Suspense>
  );
}

async function EditForm({ params }: Pick<PageProps<"/applications/[id]/edit">, "params">) {
  const { id } = await params;
  const user = await getCurrentUser();
  // A malformed id would make Postgres throw on the uuid cast
  const app = z.uuid().safeParse(id).success ? await getApplication(user.id, id) : undefined;
  if (!app) notFound();

  return (
    <>
      <Link href={`/applications/${id}`} className="link text-sm">
        &larr; Back to application
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">Edit application</h1>
      <ApplicationForm
        companies={await getCompanyNames(user.id)}
        editing={{
          id,
          values: {
            company: app.company.name,
            role: app.role,
            postingUrl: app.postingUrl ?? "",
            appliedOn: app.appliedOn ?? "",
            offeredOn: app.offeredOn ?? "",
            rejectedOn: app.rejectedOn ?? "",
            salaryMin: app.salaryMin?.toString() ?? "",
            salaryMax: app.salaryMax?.toString() ?? "",
            salaryCurrency: app.salaryCurrency,
            notes: app.notes ?? "",
          },
        }}
      />
    </>
  );
}
