"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

export function MainNav() {
  const { data: session } = useSession();

  return (
    <NavigationMenu className="hidden md:flex">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuLink
            className={navigationMenuTriggerStyle()}
            asChild
          >
            <Link href="/leaderboard">Leaderboard</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        {session && (
          <NavigationMenuItem>
            <NavigationMenuLink
              className={navigationMenuTriggerStyle()}
              asChild
            >
              <Link href="/profile">My Profile</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        )}
        {session && (
          <NavigationMenuItem>
            <NavigationMenuLink
              className={navigationMenuTriggerStyle()}
              asChild
            >
              <Link href="/settings">Settings</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        )}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
