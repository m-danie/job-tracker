import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { MIN_PASSWORD_LENGTH } from "@/utils/password";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: MIN_PASSWORD_LENGTH,
    // Register sends people to /login instead of signing them in straight away
    autoSignIn: false,
  },
  // Lets server actions set the session cookie. Must stay the last plugin.
  plugins: [nextCookies()],
});
