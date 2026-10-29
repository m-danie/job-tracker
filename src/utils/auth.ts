import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { anonymous } from "better-auth/plugins/anonymous";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { seedDemoData } from "@/db/demo";
import { newPasswordSchema } from "@/utils/auth-schemas";
import { MIN_PASSWORD_LENGTH } from "@/utils/password";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: MIN_PASSWORD_LENGTH,
    // Register sends people to /login instead of signing them in straight away
    autoSignIn: false,
  },
  hooks: {
    // Better Auth only checks the length; the form's other rules could be skipped by
    // calling the API directly, so check them here too
    before: createAuthMiddleware(async (ctx) => {
      const password =
        ctx.path === "/sign-up/email"
          ? ctx.body?.password
          : ["/change-password", "/reset-password"].includes(ctx.path)
            ? ctx.body?.newPassword
            : undefined;
      if (password !== undefined && !newPasswordSchema.safeParse(password).success) {
        throw new APIError("BAD_REQUEST", { code: "WEAK_PASSWORD", message: "Password too weak." });
      }
    }),
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
  account: {
    // GitHub only shares verified emails, so a matching email is the same person
    accountLinking: { enabled: true, trustedProviders: ["github"] },
  },
  rateLimit: {
    // Serverless instances don't share memory, so keep the counters in Postgres
    storage: "database",
    customRules: {
      // Every demo sign-in creates a user and seeds rows
      "/sign-in/anonymous": { window: 60 * 10, max: 5 },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          if ((user as { isAnonymous?: boolean }).isAnonymous) {
            await seedDemoData(user.id);
          }
        },
      },
    },
  },
  plugins: [
    // Demo accounts: a temporary user, deleted on sign-out or by the daily cron
    anonymous({ emailDomainName: "demo.invalid", generateName: () => "Demo user" }),
    // Lets server actions set the session cookie. Must stay the last plugin.
    nextCookies(),
  ],
});
