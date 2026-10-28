"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import {
  application,
  applicationContact,
  company,
  contact,
  interview,
  stageEvent,
  STAGES,
} from "@/db/schema";
import { getCurrentUser } from "@/utils/session";

export type FormState = {
  status: "idle" | "error";
  message?: string;
  // Sent back on errors so the form can refill what React's reset cleared
  values?: Record<string, string>;
};

function errorState(message: string, formData: FormData): FormState {
  const values: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string" && !key.startsWith("$")) values[key] = value;
  });
  return { status: "error", message, values };
}

// Empty form fields arrive as "", which should mean "not given"
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema.optional());

const applicationSchema = z
  .object({
    company: z.string().trim().min(1, { error: "Enter the company." }).max(200),
    role: z.string().trim().min(1, { error: "Enter the role." }).max(200),
    postingUrl: z
      .string()
      .trim()
      .min(1, { error: "Enter the link to the posting." })
      .pipe(z.url({ protocol: /^https?$/, error: "Enter a valid link (https://…)." })),
    appliedOn: optional(z.iso.date({ error: "Enter a valid date." })),
    offeredOn: optional(z.iso.date({ error: "Enter a valid offer date." })),
    rejectedOn: optional(z.iso.date({ error: "Enter a valid rejection date." })),
    salaryMin: optional(z.coerce.number().int().min(0).max(10_000_000)),
    salaryMax: optional(z.coerce.number().int().min(0).max(10_000_000)),
    salaryCurrency: z.string().trim().toUpperCase().length(3).default("USD"),
    notes: optional(z.string().trim().max(5000)),
  })
  .refine((a) => !a.salaryMin || !a.salaryMax || a.salaryMin <= a.salaryMax, {
    error: "The minimum salary is higher than the maximum.",
  });

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Reuse the user's existing company (case-insensitive) or create it
async function companyIdFor(tx: Transaction, userId: string, name: string) {
  const [existing] = await tx
    .select({ id: company.id })
    .from(company)
    .where(and(eq(company.userId, userId), sql`lower(${company.name}) = lower(${name})`));
  if (existing) return existing.id;
  const [created] = await tx
    .insert(company)
    .values({ userId, name })
    .returning({ id: company.id });
  return created.id;
}

export async function createApplicationAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  const parsed = applicationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return errorState(parsed.error.issues[0].message, formData);
  }
  const { company: companyName, ...fields } = parsed.data;

  const id = await db.transaction(async (tx) => {
    const companyId = await companyIdFor(tx, user.id, companyName);
    const [created] = await tx
      .insert(application)
      .values({ ...fields, userId: user.id, companyId })
      .returning({ id: application.id });
    await tx.insert(stageEvent).values({ applicationId: created.id, toStage: "applied" });
    return created.id;
  });

  revalidatePath("/board");
  redirect(`/applications/${id}`);
}

// Bound to the application's id in the form: updateApplicationAction.bind(null, id)
export async function updateApplicationAction(
  id: string,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  const parsed = applicationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success || !z.uuid().safeParse(id).success) {
    return errorState(parsed.error?.issues[0].message ?? "Application not found.", formData);
  }
  const { company: companyName, ...fields } = parsed.data;

  const found = await db.transaction(async (tx) => {
    // Check ownership first so a foreign id can't leave a stray company behind
    const [owned] = await tx
      .select({ id: application.id })
      .from(application)
      .where(and(eq(application.id, id), eq(application.userId, user.id)));
    if (!owned) return false;

    const companyId = await companyIdFor(tx, user.id, companyName);
    // Cleared optional fields arrive as undefined, which Drizzle would skip; store them as null
    await tx
      .update(application)
      .set({
        companyId,
        role: fields.role,
        postingUrl: fields.postingUrl,
        appliedOn: fields.appliedOn ?? null,
        offeredOn: fields.offeredOn ?? null,
        rejectedOn: fields.rejectedOn ?? null,
        salaryMin: fields.salaryMin ?? null,
        salaryMax: fields.salaryMax ?? null,
        salaryCurrency: fields.salaryCurrency,
        notes: fields.notes ?? null,
      })
      .where(eq(application.id, id));
    return true;
  });
  if (!found) {
    return errorState("Application not found.", formData);
  }

  revalidatePath("/board");
  revalidatePath(`/applications/${id}`);
  redirect(`/applications/${id}`);
}

const moveSchema = z.object({
  id: z.uuid(),
  stage: z.enum(STAGES),
  interviewOn: z.iso.date().optional(),
});

// interviewOn: the date asked for when a card moves from Applied to Interview
export async function moveApplicationAction(id: string, stage: string, interviewOn?: string) {
  const user = await getCurrentUser();
  const parsed = moveSchema.parse({ id, stage, interviewOn });

  await db.transaction(async (tx) => {
    // Lock the row so two quick drags record their history in order
    const [current] = await tx
      .select({ stage: application.stage })
      .from(application)
      .where(and(eq(application.id, parsed.id), eq(application.userId, user.id)))
      .for("update");
    if (!current || current.stage === parsed.stage) return;

    await tx
      .update(application)
      .set({
        stage: parsed.stage,
        stageChangedAt: new Date(),
        // Keep a date the user already set or edited; otherwise record today
        ...(parsed.stage === "offer" && {
          offeredOn: sql`coalesce(${application.offeredOn}, current_date)`,
        }),
        ...(parsed.stage === "rejected" && {
          rejectedOn: sql`coalesce(${application.rejectedOn}, current_date)`,
        }),
      })
      .where(eq(application.id, parsed.id));
    await tx.insert(stageEvent).values({
      applicationId: parsed.id,
      fromStage: current.stage,
      toStage: parsed.stage,
    });
    if (parsed.interviewOn) {
      await tx
        .insert(interview)
        .values({ applicationId: parsed.id, scheduledOn: parsed.interviewOn });
    }
  });

  revalidatePath("/board");
}

// The application id, if the user owns this interview
async function ownedInterview(userId: string, interviewId: string) {
  const [owned] = await db
    .select({ applicationId: interview.applicationId })
    .from(interview)
    .innerJoin(application, eq(application.id, interview.applicationId))
    .where(and(eq(interview.id, interviewId), eq(application.userId, userId)));
  return owned?.applicationId;
}

const interviewSchema = z.object({ applicationId: z.uuid(), scheduledOn: z.iso.date() });

// Plain form action: the date input is `required`, so only a tampered request fails to parse
export async function addInterviewAction(formData: FormData) {
  const user = await getCurrentUser();
  const { applicationId, scheduledOn } = interviewSchema.parse(Object.fromEntries(formData));
  const [owned] = await db
    .select({ id: application.id })
    .from(application)
    .where(and(eq(application.id, applicationId), eq(application.userId, user.id)));
  if (!owned) return;

  await db.insert(interview).values({ applicationId, scheduledOn });
  revalidatePath("/board");
  revalidatePath(`/applications/${applicationId}`);
}

export async function rescheduleInterviewAction(interviewId: string, scheduledOn: string) {
  const user = await getCurrentUser();
  const parsed = z.object({ id: z.uuid(), scheduledOn: z.iso.date() }).parse({
    id: interviewId,
    scheduledOn,
  });
  const applicationId = await ownedInterview(user.id, parsed.id);
  if (!applicationId) return;

  await db
    .update(interview)
    .set({ scheduledOn: parsed.scheduledOn })
    .where(eq(interview.id, parsed.id));
  revalidatePath("/board");
  revalidatePath(`/applications/${applicationId}`);
}

export async function deleteInterviewAction(interviewId: string) {
  const user = await getCurrentUser();
  const id = z.uuid().parse(interviewId);
  const applicationId = await ownedInterview(user.id, id);
  if (!applicationId) return;

  await db.delete(interview).where(eq(interview.id, id));
  revalidatePath("/board");
  revalidatePath(`/applications/${applicationId}`);
}

export async function deleteApplicationAction(id: string) {
  const user = await getCurrentUser();
  const parsed = z.uuid().parse(id);
  // Stage history and contact links cascade; the company and contacts stay for reuse
  await db
    .delete(application)
    .where(and(eq(application.id, parsed), eq(application.userId, user.id)));
  revalidatePath("/board");
}

const contactSchema = z.object({
  applicationId: z.uuid(),
  name: z.string().trim().min(1, { error: "Enter the contact's name." }).max(200),
  title: optional(z.string().trim().max(200)),
  email: optional(z.email({ error: "Enter a valid email address." })),
  linkedinUrl: optional(z.url({ protocol: /^https?$/, error: "Enter a valid LinkedIn link." })),
});

export async function addContactAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return errorState(parsed.error.issues[0].message, formData);
  }
  const { applicationId, ...fields } = parsed.data;

  const [owned] = await db
    .select({ companyId: application.companyId })
    .from(application)
    .where(and(eq(application.id, applicationId), eq(application.userId, user.id)));
  if (!owned) {
    return errorState("Application not found.", formData);
  }

  await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(contact)
      .values({ ...fields, userId: user.id, companyId: owned.companyId })
      .returning({ id: contact.id });
    await tx.insert(applicationContact).values({ applicationId, contactId: created.id });
  });

  revalidatePath(`/applications/${applicationId}`);
  return { status: "idle" };
}
