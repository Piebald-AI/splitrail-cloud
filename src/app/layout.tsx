import type { Metadata } from "next";
import { Figtree, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "@/components/auth/session-provider";
import Footer from "@/components/footer";
import { Analytics } from "@vercel/analytics/next";
import Navbar from "@/components/navbar";
import Main from "@/components/main";
import { ThemeProvider } from "next-themes";
import ClientProviders from "./client-providers";
import { Toaster } from "@/components/ui/sonner";

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
  title: "Splitrail Cloud",
  description:
    "Sync your agentic development stats across your devices and show off via our leaderboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${figtree.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider attribute="class" enableSystem>
          <AuthSessionProvider>
            <ClientProviders>
              <Toaster richColors position="bottom-right" />
              <div className="w-full grid min-h-full grid-rows-[auto_1fr_auto]">
                <Navbar />
                <Main>{children}</Main>
                <Footer />
              </div>
            </ClientProviders>
          </AuthSessionProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
