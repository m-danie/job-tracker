import Link from "next/link";
import { Suspense } from "react";
import { signOutAction } from "@/app/(auth)/actions";
import { getCurrentUser } from "@/utils/session";

// Shell for signed-in pages. src/proxy.ts and getCurrentUser() protect them.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="navbar border-b border-base-300 px-4">
        <div className="flex-1">
          <Link href="/board" className="text-lg font-semibold">
            Job Tracker
          </Link>
        </div>
        <Suspense fallback={<span className="loading loading-spinner loading-sm" aria-label="Loading" />}>
          <UserMenu />
        </Suspense>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">{children}</main>
    </>
  );
}

async function UserMenu() {
  const user = await getCurrentUser();
  return (
    <div className="flex items-center gap-3 text-sm">
      {user.isDemo ? (
        <span className="badge badge-warning">Demo account, deleted on sign-out</span>
      ) : (
        <span className="hidden sm:inline">{user.email}</span>
      )}
      <form action={signOutAction}>
        <button type="submit" className="btn btn-sm">
          Sign out
        </button>
      </form>
    </div>
  );
}
