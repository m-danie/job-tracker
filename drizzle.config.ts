import { defineConfig } from "drizzle-kit";

// drizzle-kit runs outside Next.js, so it doesn't load .env.local by itself
process.loadEnvFile(".env.local");

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema",
  out: "./drizzle",
  dbCredentials: {
    // Direct (unpooled) connection: migrations shouldn't go through the pooler
    url: process.env.DATABASE_URL_UNPOOLED!,
  },
});
