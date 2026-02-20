"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import LogoCloud from "./logo-cloud";
import { SignInButton } from "./auth/sign-in-button";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/settings", label: "Settings" },
];

function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    // We need an element here, even if it's empty, to ensure the grid layout works correctly.
    <header>
      {!session && pathname === "/" ? null : (
        <div className="container mx-auto px-6 py-2.5 flex items-center justify-between border-b border-border/60">
          <div className="flex items-center gap-7">
            <Link
              href={session ? "/" : "/leaderboard"}
              className="flex items-center shrink-0"
            >
              <LogoCloud width={210} className="text-logo" />
            </Link>
            {session && (
              <nav className="hidden sm:flex items-center gap-0.5">
                {NAV_LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                      pathname === href
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    )}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            )}
          </div>
          <SignInButton />
        </div>
      )}
    </header>
  );
}

export default Navbar;
