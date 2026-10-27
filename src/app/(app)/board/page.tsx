import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Board } from "@/components/board";
import { getBoardApplications } from "@/db/queries";
import { getCurrentUser } from "@/utils/session";

export const metadata: Metadata = {
  title: "Board",
};

export default function BoardPage() {
  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Applications</h1>
        <Link href="/applications/new" className="btn btn-primary btn-sm">
          Add application
        </Link>
      </div>
      <Suspense fallback={<span className="loading loading-spinner" aria-label="Loading" />}>
        <BoardData />
      </Suspense>
    </>
  );
}

async function BoardData() {
  const user = await getCurrentUser();
  const applications = await getBoardApplications(user.id);
  return <Board applications={applications} />;
}
