import { and, eq, lt } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";

const MAX_AGE_MS = 24 * 60 * 60 * 1000;

// Called daily by Vercel Cron (vercel.json). Demo users who never signed out
// are deleted after a day; their applications, contacts etc. cascade.
export async function GET(request: Request) {
  // Vercel sends CRON_SECRET as a bearer token; anyone else gets a 401
  if (
    !process.env.CRON_SECRET ||
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  const deleted = await db
    .delete(user)
    .where(and(eq(user.isAnonymous, true), lt(user.createdAt, new Date(Date.now() - MAX_AGE_MS))))
    .returning({ id: user.id });

  return Response.json({ deleted: deleted.length });
}
