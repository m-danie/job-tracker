import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Log in",
};

export default function LoginPage() {
  return (
    <>
      <AuthForm mode="login" />
      <p className="mt-6 text-center text-sm">
        Don&rsquo;t have an account?{" "}
        <Link href="/register" className="link">
          Register
        </Link>
      </p>
    </>
  );
}
