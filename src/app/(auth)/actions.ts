"use server";

import { isAPIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/utils/auth";
import { MIN_PASSWORD_LENGTH } from "@/utils/password";

export type AuthFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  // Sent back so the form can keep the email after React resets it
  email?: string;
};

const email = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Enter a valid email address." }));

const loginSchema = z.object({
  email,
  password: z.string().min(1, { error: "Enter your password." }),
});

const registerSchema = z.object({
  email,
  password: z
    .string()
    .min(MIN_PASSWORD_LENGTH, {
      error: `Use at least ${MIN_PASSWORD_LENGTH} characters.`,
    })
    .max(128, { error: "Use at most 128 characters." }),
});

export async function signUpAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return errorState(parsed.error.issues[0].message, formData);
  }

  try {
    await auth.api.signUpEmail({
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
        // Better Auth requires a name; the form doesn't ask for one yet
        name: parsed.data.email.split("@")[0],
      },
      headers: await headers(),
    });
  } catch (error) {
    return errorState(messageFor(error), formData);
  }

  return { status: "success", email: parsed.data.email };
}

export async function signInAction(
  _previous: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return errorState(parsed.error.issues[0].message, formData);
  }

  try {
    // nextCookies() in auth.ts sets the session cookie on this response
    await auth.api.signInEmail({
      body: parsed.data,
      headers: await headers(),
    });
  } catch (error) {
    return errorState(messageFor(error), formData);
  }

  // Outside the try: redirect() works by throwing, so a catch would swallow it
  redirect("/dashboard");
}

export async function signOutAction() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/login");
}

function errorState(message: string, formData: FormData): AuthFormState {
  const submitted = formData.get("email");
  return {
    status: "error",
    message,
    email: typeof submitted === "string" ? submitted : undefined,
  };
}

function messageFor(error: unknown): string {
  if (isAPIError(error)) {
    if (error.status === "TOO_MANY_REQUESTS") {
      return "Too many attempts. Please wait a minute and try again.";
    }
    switch (error.body?.code) {
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
  }
  console.error("Auth action failed", error);
  return "Something went wrong. Please try again.";
}
