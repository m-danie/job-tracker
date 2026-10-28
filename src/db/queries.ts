import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { application, company, interview } from "@/db/schema";

// Every query takes the signed-in user's id, so one user can never read another's rows

export async function getBoardApplications(userId: string) {
  const [rows, interviews] = await Promise.all([
    getBoardRows(userId),
    db
      .select({
        id: interview.id,
        applicationId: interview.applicationId,
        scheduledOn: interview.scheduledOn,
      })
      .from(interview)
      .innerJoin(application, eq(application.id, interview.applicationId))
      .where(eq(application.userId, userId))
      .orderBy(asc(interview.scheduledOn)),
  ]);
  return rows.map((row) => ({
    ...row,
    // Oldest first
    interviews: interviews
      .filter((i) => i.applicationId === row.id)
      .map(({ id, scheduledOn }) => ({ id, scheduledOn })),
  }));
}

function getBoardRows(userId: string) {
  return db
    .select({
      id: application.id,
      role: application.role,
      stage: application.stage,
      stageChangedAt: application.stageChangedAt,
      company: company.name,
      // For the card's quick-view popup
      appliedOn: application.appliedOn,
      offeredOn: application.offeredOn,
      rejectedOn: application.rejectedOn,
      salaryMin: application.salaryMin,
      salaryMax: application.salaryMax,
      salaryCurrency: application.salaryCurrency,
      postingUrl: application.postingUrl,
      notes: application.notes,
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
      interviews: { orderBy: (row, { asc }) => [asc(row.scheduledOn)] },
      contacts: { with: { contact: true } },
    },
  });
}
