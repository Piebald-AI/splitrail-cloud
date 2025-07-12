import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';
import "./globals.css";
import { AuthSessionProvider } from "@/components/auth/session-provider";
import { SignInButton } from "@/components/auth/sign-in-button";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import Image from "next/image";
import { MainNav } from "@/components/main-nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "Splitrail Leaderboard",
  description:
    "Competitive leaderboard for developers using agentic workflow tools.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthSessionProvider>
          <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container mx-auto px-6 py-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-4">
                      <Image
                        src="/logo.svg"
                        alt="Splitrail Leaderboard"
                        width={150}
                        height={150}
                      />
                    </Link>
                    <MainNav />
                  </div>
                  <SignInButton />
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="py-6 flex-grow pt-8">{children}</main>

            {/* Footer */}
            <footer className="mt-auto">
              <Separator />
              <div className="container mx-auto px-6 py-8">
                <div className="text-center text-sm text-muted-foreground">
                  <p>
                    © 2025{" "}
                    <Button
                      variant="link"
                      size="sm"
                      asChild
                      className="h-auto p-0"
                    >
                      <Link href="https://piebald.ai">Piebald, LLC.</Link>
                    </Button>{" "}
                    Inspiring developers to embrace agentic AI development.
                  </p>
                  <p className="mt-2">
                    <Button
                      variant="link"
                      size="sm"
                      asChild
                      className="h-auto p-0"
                    >
                      <Link href="https://github.com/piebald-ai/splitrail">
                        View Splitrail on GitHub
                      </Link>
                    </Button>
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
