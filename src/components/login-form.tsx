"use client";

import type { FormEvent } from "react";

export function LoginForm() {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    // Not wired to auth yet. Without this, the browser would submit as a GET
    // request and put the password in the URL.
    event.preventDefault();
  }

  return (
    <form onSubmit={handleSubmit}>
      <fieldset className="fieldset">
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="input w-full"
          autoComplete="email"
          required
        />

        <label className="label mt-2" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="input w-full"
          autoComplete="current-password"
          required
        />

        <button type="submit" className="btn btn-block mt-4">
          Log in
        </button>
      </fieldset>
    </form>
  );
}
