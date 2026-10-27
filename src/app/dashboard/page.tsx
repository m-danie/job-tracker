import type { Metadata } from "next";
import { Suspense } from "react";
import { signOutAction } from "@/app/(auth)/actions";
import { getCurrentUser } from "@/utils/session";

export const metadata: Metadata = {
  title: "Dashboard",
};

// Placeholder landing page after login, until the board replaces it.
export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      {/* Reads the session, so it streams in behind the boundary */}
      <Suspense
        fallback={<span className="loading loading-spinner mt-4" aria-label="Loading" />}
      >
        <CurrentUser />
      </Suspense>
    </main>
  );
}

async function CurrentUser() {
  const user = await getCurrentUser();
  return (
    <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
      <p>
        Signed in as <strong>{user.email}</strong>
      </p>
      <form action={signOutAction}>
        <button type="submit" className="btn btn-sm">
          Sign out
        </button>
      </form>
    </div>
  );
}
