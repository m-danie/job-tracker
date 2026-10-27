import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { application, company } from "@/db/schema";

// Every query takes the signed-in user's id, so one user can never read another's rows

export async function getBoardApplications(userId: string) {
  return db
    .select({
      id: application.id,
      role: application.role,
      stage: application.stage,
      stageChangedAt: application.stageChangedAt,
      company: company.name,
    })
    .from(application)
    .innerJoin(company, eq(company.id, application.companyId))
    .where(eq(application.userId, userId))
    .orderBy(desc(application.stageChangedAt));
}

export type BoardApplication = Awaited<ReturnType<typeof getBoardApplications>>[number];

export async function getCompanyNames(userId: string) {
  const rows = await db
    .select({ name: company.name })
    .from(company)
    .where(eq(company.userId, userId))
    .orderBy(asc(company.name));
  return rows.map((row) => row.name);
}

export async function getApplication(userId: string, id: string) {
  return db.query.application.findFirst({
    where: and(eq(application.id, id), eq(application.userId, userId)),
    with: {
      company: true,
      stageEvents: { orderBy: (event, { desc }) => [desc(event.changedAt)] },
      contacts: { with: { contact: true } },
    },
  });
}
