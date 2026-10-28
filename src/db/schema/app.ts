import { relations, sql } from "drizzle-orm";
import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { STAGES } from "../../utils/stages";
import { user } from "./auth";

export { STAGES, type Stage } from "../../utils/stages";
export const stage = pgEnum("stage", STAGES);

const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).defaultNow().notNull();

export const company = pgTable(
  "company",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: createdAt(),
  },
  // One "Acme" per user, whatever the capitalisation
  (t) => [uniqueIndex("company_user_name_idx").on(t.userId, sql`lower(${t.name})`)],
);

export const contact = pgTable(
  "contact",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    companyId: uuid("company_id")
      .notNull()
      .references(() => company.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    // e.g. "Recruiter", "Hiring manager"
    title: text("title"),
    email: text("email"),
    linkedinUrl: text("linkedin_url"),
    notes: text("notes"),
    createdAt: createdAt(),
  },
  (t) => [index("contact_company_idx").on(t.companyId)],
);

export const application = pgTable(
  "application",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    companyId: uuid("company_id")
      .notNull()
      // No action (checked at statement end) so deleting a user can cascade through both
      .references(() => company.id, { onDelete: "no action" }),
    role: text("role").notNull(),
    postingUrl: text("posting_url"),
    // Groundwork for the AI step: the pasted job description
    description: text("description"),
    appliedOn: date("applied_on"),
    // Set to today when the card first moves to Offer / Rejected; editable afterwards
    offeredOn: date("offered_on"),
    rejectedOn: date("rejected_on"),
    salaryMin: integer("salary_min"),
    salaryMax: integer("salary_max"),
    salaryCurrency: text("salary_currency").default("USD").notNull(),
    notes: text("notes"),
    stage: stage("stage").default("applied").notNull(),
    stageChangedAt: timestamp("stage_changed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("application_user_idx").on(t.userId)],
);

// One row per stage change; the first row (fromStage null) is the creation
export const stageEvent = pgTable(
  "stage_event",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => application.id, { onDelete: "cascade" }),
    fromStage: stage("from_stage"),
    toStage: stage("to_stage").notNull(),
    changedAt: timestamp("changed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("stage_event_application_idx").on(t.applicationId)],
);

// An application can have several interview rounds
export const interview = pgTable(
  "interview",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => application.id, { onDelete: "cascade" }),
    scheduledOn: date("scheduled_on").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("interview_application_idx").on(t.applicationId)],
);

export const applicationContact = pgTable(
  "application_contact",
  {
    applicationId: uuid("application_id")
      .notNull()
      .references(() => application.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contact.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.applicationId, t.contactId] })],
);

export const companyRelations = relations(company, ({ many }) => ({
  applications: many(application),
  contacts: many(contact),
}));

export const contactRelations = relations(contact, ({ one, many }) => ({
  company: one(company, { fields: [contact.companyId], references: [company.id] }),
  applications: many(applicationContact),
}));

export const applicationRelations = relations(application, ({ one, many }) => ({
  company: one(company, { fields: [application.companyId], references: [company.id] }),
  stageEvents: many(stageEvent),
  interviews: many(interview),
  contacts: many(applicationContact),
}));

export const interviewRelations = relations(interview, ({ one }) => ({
  application: one(application, {
    fields: [interview.applicationId],
    references: [application.id],
  }),
}));

export const stageEventRelations = relations(stageEvent, ({ one }) => ({
  application: one(application, {
    fields: [stageEvent.applicationId],
    references: [application.id],
  }),
}));

export const applicationContactRelations = relations(applicationContact, ({ one }) => ({
  application: one(application, {
    fields: [applicationContact.applicationId],
    references: [application.id],
  }),
  contact: one(contact, { fields: [applicationContact.contactId], references: [contact.id] }),
}));
