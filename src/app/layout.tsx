import type { Metadata } from "next";
import { Figtree, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "@/components/auth/session-provider";
import { SignInButton } from "@/components/auth/sign-in-button";
import Link from "next/link";
import Image from "next/image";
import { ConditionalNav } from "@/components/conditional-nav";
import { ConditionalFooter } from "@/components/conditional-footer";

const figtree = Figtree({
  variable: "--font-figtree",
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
        className={`${figtree.variable} ${geistMono.variable} font-sans antialiased`}
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
                    <ConditionalNav />
                  </div>
                  <SignInButton />
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="py-6 flex-grow pt-8">{children}</main>

            <ConditionalFooter />
          </div>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
