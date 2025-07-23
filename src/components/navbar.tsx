"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { SignInButton } from "./auth/sign-in-button";
import Logo from "./logo";

const NavLink = ({ path, label }: { path: string; label: string }) => {
  const pathname = usePathname();

  return (
    <NavigationMenuItem>
      <NavigationMenuLink
        className={cn(navigationMenuTriggerStyle(), "text-md transition-all", {
          "bg-gradient-to-br from-primary to-[#307850] hover:opacity-90 !text-white hover:!text-white":
            pathname === path,
        })}
        asChild
      >
        <Link href={path}>{label}</Link>
      </NavigationMenuLink>
    </NavigationMenuItem>
  );
};

function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <header className={pathname !== "/" ? "" : ""}>
      {pathname !== "/" && (
        <div className="container mx-auto px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-4">
              <Logo width={150} className="text-logo" />
            </Link>

            <NavigationMenu className="hidden md:flex">
              <NavigationMenuList>
                <NavLink path="/leaderboard" label="Leaderboard" />
                {session && <NavLink path="/profile" label="My Profile" />}
                {session && <NavLink path="/settings" label="Settings" />}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          <SignInButton />
        </div>
      )}
    </header>
  );
}

export default Navbar;
