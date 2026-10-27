import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/utils/auth";

// The one place that reads the session (Data Access Layer). Returns a narrow
// user so session internals never reach components. Reads request headers, so
// callers must render behind a <Suspense> boundary (Cache Components).
export async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  };
}
