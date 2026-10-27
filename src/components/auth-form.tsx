"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  signInAction,
  signUpAction,
  type AuthFormState,
} from "@/app/(auth)/actions";
import { MIN_PASSWORD_LENGTH } from "@/utils/password";

const initialState: AuthFormState = { status: "idle" };

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

  const [state, formAction, pending] = useActionState(
    isRegister ? signUpAction : signInAction,
    initialState,
  );

  useEffect(() => {
    // Login redirects on the server; register reports success so we can toast.
    // The toast survives the navigation because <Toaster /> is in the root layout.
    if (isRegister && state.status === "success") {
      toast.success("Account created");
      router.push("/login");
    }
  }, [isRegister, state, router]);

  return (
    <form action={formAction}>
      <fieldset className="fieldset" disabled={pending}>
        {state.status === "error" && (
          <div role="alert" className="alert alert-error alert-soft mb-2">
            {state.message}
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
          // React resets the form after an action; keep what was typed
          defaultValue={state.email}
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
          {pending && <span className="loading loading-spinner loading-sm" />}
          {isRegister ? "Register" : "Log in"}
        </button>
      </fieldset>
    </form>
  );
}
