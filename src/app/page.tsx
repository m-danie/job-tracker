import { redirect } from "next/navigation";

// The dashboard checks the session and sends logged-out visitors to /login.
// (Reading the session here would need a Suspense boundary under Cache Components.)
export default function Home() {
  redirect("/dashboard");
}
