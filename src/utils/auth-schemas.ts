import { z } from "zod";
import { MIN_PASSWORD_LENGTH } from "@/utils/password";

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Enter a valid email address." }));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, { error: "Enter your password." }),
});

export const registerSchema = z.object({
  email,
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, {
      error: `Use at least ${MIN_PASSWORD_LENGTH} characters.`,
    })
    .max(128, { error: "Use at most 128 characters." }),
});

type AuthError = { code?: string; status?: number };

export function messageFor(error: AuthError): string {
  if (error.status === 429) {
    return "Too many attempts. Please wait a minute and try again.";
  }
  switch (error.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "Invalid email or password.";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "An account with this email already exists.";
    case "PASSWORD_TOO_SHORT":
      return `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    case "INVALID_EMAIL":
      return "Enter a valid email address.";
  }
  console.error("Auth request failed", error);
  return "Something went wrong. Please try again.";
}
