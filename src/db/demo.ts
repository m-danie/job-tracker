import { db } from "@/db";
import {
  application,
  applicationContact,
  company,
  contact,
  stageEvent,
  type Stage,
} from "@/db/schema";

// Fictional data copied into every new demo user. It lives in code, not in a
// shared account, so nothing a visitor does can change what the next one sees.
const COMPANIES = [
  "Northwind Labs",
  "Bluefin Analytics",
  "Paperkite",
  "Orbital Foods",
  "Lumen Health",
  "Quarry Systems",
] as const;

type DemoContact = { name: string; title: string; email: string };

type DemoApplication = {
  company: (typeof COMPANIES)[number];
  role: string;
  appliedDaysAgo: number;
  salary?: [number, number];
  notes?: string;
  // Stage changes after "applied", as [stage, days ago]
  moves?: [Stage, number][];
  contacts?: DemoContact[];
};

const APPLICATIONS: DemoApplication[] = [
  {
    company: "Northwind Labs",
    role: "Senior Full-Stack Engineer",
    appliedDaysAgo: 24,
    salary: [140000, 165000],
    notes: "Referred by a former colleague. Stack: Next.js, Postgres.",
    moves: [["interview", 17], ["offer", 3]],
    contacts: [
      { name: "Priya Raman", title: "Recruiter", email: "priya@northwind.example" },
      { name: "Tom Becker", title: "Engineering Manager", email: "tom@northwind.example" },
    ],
  },
  {
    company: "Bluefin Analytics",
    role: "Frontend Engineer",
    appliedDaysAgo: 18,
    salary: [120000, 140000],
    moves: [["interview", 9]],
    contacts: [{ name: "Alex Moreau", title: "Recruiter", email: "alex@bluefin.example" }],
  },
  {
    company: "Paperkite",
    role: "Full-Stack Developer",
    appliedDaysAgo: 12,
    notes: "Small team, fully remote. Take-home due Friday.",
    moves: [["interview", 5]],
  },
  {
    company: "Orbital Foods",
    role: "Software Engineer, Platform",
    appliedDaysAgo: 30,
    salary: [130000, 150000],
    moves: [["interview", 21], ["rejected", 14]],
    notes: "Feedback: wanted more Kubernetes experience.",
  },
  {
    company: "Lumen Health",
    role: "React Engineer",
    appliedDaysAgo: 6,
    salary: [115000, 135000],
  },
  {
    company: "Quarry Systems",
    role: "Backend Engineer (Node.js)",
    appliedDaysAgo: 3,
    contacts: [{ name: "Sam Okafor", title: "Hiring Manager", email: "sam@quarry.example" }],
  },
  {
    company: "Paperkite",
    role: "Developer Advocate",
    appliedDaysAgo: 2,
  },
];

const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

export async function seedDemoData(userId: string) {
  await db.transaction(async (tx) => {
    const companies = await tx
      .insert(company)
      .values(COMPANIES.map((name) => ({ userId, name })))
      .returning({ id: company.id, name: company.name });
    const companyId = new Map(companies.map((c) => [c.name, c.id]));

    for (const demo of APPLICATIONS) {
      const moves = demo.moves ?? [];
      const last = moves.at(-1);
      const [created] = await tx
        .insert(application)
        .values({
          userId,
          companyId: companyId.get(demo.company)!,
          role: demo.role,
          postingUrl: "https://example.com/jobs",
          appliedOn: daysAgo(demo.appliedDaysAgo).toISOString().slice(0, 10),
          salaryMin: demo.salary?.[0],
          salaryMax: demo.salary?.[1],
          notes: demo.notes,
          stage: last?.[0] ?? "applied",
          stageChangedAt: daysAgo(last?.[1] ?? demo.appliedDaysAgo),
          createdAt: daysAgo(demo.appliedDaysAgo),
        })
        .returning({ id: application.id });

      let from: Stage = "applied";
      await tx.insert(stageEvent).values([
        {
          applicationId: created.id,
          fromStage: null,
          toStage: "applied",
          changedAt: daysAgo(demo.appliedDaysAgo),
        },
        ...moves.map(([to, days]) => {
          const event = { applicationId: created.id, fromStage: from, toStage: to, changedAt: daysAgo(days) };
          from = to;
          return event;
        }),
      ]);

      if (demo.contacts?.length) {
        const contacts = await tx
          .insert(contact)
          .values(demo.contacts.map((c) => ({ ...c, userId, companyId: companyId.get(demo.company)! })))
          .returning({ id: contact.id });
        await tx
          .insert(applicationContact)
          .values(contacts.map((c) => ({ applicationId: created.id, contactId: c.id })));
      }
    }
  });
}
