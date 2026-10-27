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
    salaryMin: optional(z.coerce.number().int().min(0).max(10_000_000)),
    salaryMax: optional(z.coerce.number().int().min(0).max(10_000_000)),
    salaryCurrency: z.string().trim().toUpperCase().length(3).default("USD"),
    notes: optional(z.string().trim().max(5000)),
  })
  .refine((a) => !a.salaryMin || !a.salaryMax || a.salaryMin <= a.salaryMax, {
    error: "The minimum salary is higher than the maximum.",
  });

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
    // Reuse the user's existing company (case-insensitive) or create it
    const [existing] = await tx
      .select({ id: company.id })
      .from(company)
      .where(and(eq(company.userId, user.id), sql`lower(${company.name}) = lower(${companyName})`));
    const companyId =
      existing?.id ??
      (
        await tx
          .insert(company)
          .values({ userId: user.id, name: companyName })
          .returning({ id: company.id })
      )[0].id;

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

const moveSchema = z.object({ id: z.uuid(), stage: z.enum(STAGES) });

export async function moveApplicationAction(id: string, stage: string) {
  const user = await getCurrentUser();
  const parsed = moveSchema.parse({ id, stage });

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
      .set({ stage: parsed.stage, stageChangedAt: new Date() })
      .where(eq(application.id, parsed.id));
    await tx.insert(stageEvent).values({
      applicationId: parsed.id,
      fromStage: current.stage,
      toStage: parsed.stage,
    });
  });

  revalidatePath("/board");
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
