import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/utils/auth";

// The one place that reads the session (Data Access Layer). Returns a narrow
// user so session internals never reach components. Reads request headers, so
// callers must render behind a <Suspense> boundary (Cache Components).
// cache(): the layout and page share one lookup per request.
export const getCurrentUser = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    isDemo: Boolean(session.user.isAnonymous),
  };
});
