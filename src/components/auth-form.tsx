"use client";

import { useId, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const MIN_PASSWORD_LENGTH = 12;

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const isRegister = mode === "register";
  // Unique per form instance: Next.js keeps the previous page mounted (hidden),
  // so /login and /register can be in the DOM at the same time.
  const id = useId();
  const emailId = `${id}-email`;
  const passwordId = `${id}-password`;
  const hintId = `${id}-password-hint`;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Not wired to auth yet. Without this, the browser would submit as a GET
    // request and put the password in the URL.
    event.preventDefault();

    if (isRegister) {
      // Fake success until the backend exists. The toast survives the
      // navigation because <Toaster /> lives in the root layout.
      toast.success("Account created");
      router.push("/login");
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <fieldset className="fieldset">
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
        <div className="input w-full">
          <input
            id={passwordId}
            name="password"
            type={showPassword ? "text" : "password"}
            // "new-password" makes password managers offer to generate one
            autoComplete={isRegister ? "new-password" : "current-password"}
            minLength={isRegister ? MIN_PASSWORD_LENGTH : undefined}
            aria-describedby={isRegister ? hintId : undefined}
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
          <p id={hintId} className="label">
            At least {MIN_PASSWORD_LENGTH} characters
          </p>
        )}

        <button
          type="submit"
          className={`btn btn-outline mt-4 ${isRegister ? "btn-secondary" : "btn-primary"}`}
        >
          {isRegister ? "Register" : "Log in"}
        </button>
      </fieldset>
    </form>
  );
}
