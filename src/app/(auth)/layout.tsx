import { ThemeToggle } from "@/components/theme-toggle";

// Shared shell for /login and /register. The (auth) folder is a route group:
// it shares this layout without adding "/auth" to the URL.
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="relative flex flex-1 items-center justify-center px-4 py-16">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-2xl font-semibold">
          Danié&rsquo;s Job Tracker
        </h1>
        {children}
      </div>
    </main>
  );
}
