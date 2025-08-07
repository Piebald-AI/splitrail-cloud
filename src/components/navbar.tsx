"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import LogoCloud from "./logo-cloud";
import { SignInButton } from "./auth/sign-in-button";

function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    // We need an element here, even if it's empty, to ensure the grid layout works correctly.
    <header>
      {!session && pathname === "/" ? null : (
        <div className="container mx-auto px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href={session ? "/" : "/leaderboard"}
              className="flex items-center gap-4"
            >
              <LogoCloud width={225} className="text-logo" />
            </Link>
          </div>
          <SignInButton />
        </div>
      )}
    </header>
  );
}

export default Navbar;
