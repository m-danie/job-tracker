"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/utils/auth-client";
import { loginSchema, messageFor, newPasswordSchema, registerSchema } from "@/utils/auth-schemas";
import { PASSWORD_HINT } from "@/utils/password";

type AuthFormProps = {
  mode: "login" | "register";
};

type Pending = "email" | "github" | "demo" | null;

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  const [error, setError] = useState<string | null>(null);
  // The password broke a register rule: the field and its hint turn red
  const [passwordInvalid, setPasswordInvalid] = useState(false);
  const isRegister = mode === "register";
  // Unique per form instance: Next.js keeps the previous page mounted (hidden),
  // so /login and /register can be in the DOM at the same time.
  const id = useId();
  const emailId = `${id}-email`;
  const passwordId = `${id}-password`;
  const hintId = `${id}-password-hint`;

  // Next.js keeps this page mounted (hidden) after a successful sign-in navigates away,
  // and shows the same instance again on sign-out. Reset when it's hidden, or the form
  // comes back still disabled and "signing in".
  useEffect(
    () => () => {
      setPending(null);
      setError(null);
      setPasswordInvalid(false);
    },
    [],
  );

  async function run(kind: Pending, request: () => Promise<{ error: unknown }>) {
    setPending(kind);
    setError(null);
    const { error } = await request();
    if (error) {
      setError(messageFor(error as { code?: string; status?: number }));
      setPending(null);
      return false;
    }
    return true;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const schema = isRegister ? registerSchema : loginSchema;
    const parsed = schema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) {
      const [issue] = parsed.error.issues;
      setError(issue.message);
      setPasswordInvalid(isRegister && issue.path[0] === "password");
      return;
    }
    const { email, password } = parsed.data;

    if (isRegister) {
      // Better Auth requires a name; the form doesn't ask for one yet
      const ok = await run("email", () =>
        authClient.signUp.email({ email, password, name: email.split("@")[0] }),
      );
      if (ok) {
        // The toast survives the navigation because <Toaster /> is in the root layout
        toast.success("Account created");
        router.push("/login");
      }
    } else if (await run("email", () => authClient.signIn.email({ email, password }))) {
      router.push("/board");
    }
  }

  function signInWithGitHub() {
    // On success the browser leaves for GitHub, so pending stays set
    run("github", () =>
      authClient.signIn.social({
        provider: "github",
        callbackURL: `${window.location.origin}/board`,
        errorCallbackURL: `${window.location.origin}/login`,
      }),
    );
  }

  async function signInAsDemo() {
    // The user-create hook in auth.ts seeds the demo data before this returns
    if (await run("demo", () => authClient.signIn.anonymous())) {
      router.push("/board");
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <fieldset className="fieldset" disabled={pending !== null}>
          {error && (
            <div role="alert" className="alert alert-error alert-soft mb-2">
              {error}
            </div>
          )}

          <label className="label" htmlFor={emailId}>
            Email
          </label>
          <input
            id={emailId}
            name="email"
            type="email"
            className="input w-full"
            autoComplete="email"
            required
          />

          <label className="label mt-2" htmlFor={passwordId}>
            Password
          </label>
          <div className={`input w-full ${passwordInvalid ? "input-error" : ""}`}>
            <input
              id={passwordId}
              name="password"
              type={showPassword ? "text" : "password"}
              // "new-password" makes password managers offer to generate one
              autoComplete={isRegister ? "new-password" : "current-password"}
              // No minLength: the browser's own bubble would block the submit before our checks
              aria-describedby={isRegister ? hintId : undefined}
              aria-invalid={passwordInvalid || undefined}
              // Drops the red as soon as the rules are met
              onChange={(event) => {
                if (passwordInvalid && newPasswordSchema.safeParse(event.target.value).success) {
                  setPasswordInvalid(false);
                }
              }}
              required
            />
            <button
              type="button"
              className="btn btn-ghost btn-xs"
              onClick={() => setShowPassword((shown) => !shown)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-controls={passwordId}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
          {isRegister && (
            <p id={hintId} className={`label whitespace-normal ${passwordInvalid ? "text-error" : ""}`}>
              {PASSWORD_HINT}
            </p>
          )}

          <button
            type="submit"
            className={`btn btn-outline mt-4 ${isRegister ? "btn-secondary" : "btn-primary"}`}
          >
            {pending === "email" && <span className="loading loading-spinner loading-sm" />}
            {isRegister ? "Register" : "Log in"}
          </button>
        </fieldset>
      </form>

      <div className="divider text-sm">or</div>

      <fieldset className="flex flex-col gap-2" disabled={pending !== null}>
        <button type="button" className="btn" onClick={signInWithGitHub}>
          {pending === "github" ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            <GitHubIcon />
          )}
          Continue with GitHub
        </button>
        {!isRegister && (
          <button type="button" className="btn btn-ghost" onClick={signInAsDemo}>
            {pending === "demo" && <span className="loading loading-spinner loading-sm" />}
            Log in with a Demo Account
          </button>
        )}
      </fieldset>
    </div>
  );
}

function GitHubIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="currentColor">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
