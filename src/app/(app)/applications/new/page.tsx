import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ApplicationForm } from "@/components/application-form";
import { getCompanyNames } from "@/db/queries";
import { getCurrentUser } from "@/utils/session";

export const metadata: Metadata = {
  title: "Add application",
};

export default function NewApplicationPage() {
  return (
    <>
      <Link href="/board" className="link text-sm">
        &larr; Back to board
      </Link>
      <h1 className="mt-2 mb-6 text-2xl font-semibold">Add application</h1>
      <Suspense fallback={<span className="loading loading-spinner" aria-label="Loading" />}>
        <FormWithCompanies />
      </Suspense>
    </>
  );
}

async function FormWithCompanies() {
  const user = await getCurrentUser();
  return <ApplicationForm companies={await getCompanyNames(user.id)} />;
}
