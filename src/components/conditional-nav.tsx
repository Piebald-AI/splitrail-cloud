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

const NavLink = ({ path, label }: { path: string; label: string }) => {
  const pathname = usePathname();

  return (
    <NavigationMenuItem>
      <NavigationMenuLink
        className={cn(navigationMenuTriggerStyle(), "text-md transition-all", {
          "bg-gradient-to-br from-primary to-[#307850] hover:opacity-90 text-white hover:text-white": pathname === path,
        })}
        asChild
      >
        <Link href={path}>{label}</Link>
      </NavigationMenuLink>
    </NavigationMenuItem>
  );
}

export function ConditionalNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (pathname === "/") {
    return null;
  }

  return (
    <NavigationMenu className="hidden md:flex">
      <NavigationMenuList>
        <NavLink path="/leaderboard" label="Leaderboard" />
        {session && <NavLink path="/profile" label="My Profile" />}
        {session && <NavLink path="/settings" label="Settings" />}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
