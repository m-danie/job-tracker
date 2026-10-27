import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { ThemeToggle } from "@/components/theme-toggle";
import { Toaster } from "@/components/toaster";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Job Tracker",
    template: "%s · Job Tracker",
  },
  description: "Track job applications from first apply to offer.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      // The theme script below sets data-theme before React hydrates
      suppressHydrationWarning
    >
      <head>
        {/* Applies a saved theme choice before first paint, so there's no flash */}
        <Script id="theme" strategy="beforeInteractive">
          {`try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <div className="fixed right-4 bottom-4 z-40">
          <ThemeToggle />
        </div>
        <Toaster />
      </body>
    </html>
  );
}
