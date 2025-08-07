"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { getDisplayName } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Cog, LogOut } from "lucide-react";
import Link from "next/link";

export function SignInButton() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn("github");
    } finally {
      setIsLoading(false);
    }
  };


  if (status === "loading") {
    return <Spinner size="default" className="m-2.5" />;
  }

  if (session?.user) {
    return (
      <div className="p-1">
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none rounded-full focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] transition">
            <Avatar className="size-8">
              <AvatarImage
                src={session.user.image || undefined}
                alt={session.user.name || "User"}
              />
              <AvatarFallback className="text-sm font-medium">
                {session.user.name?.charAt(0).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar className="size-8">
                <AvatarImage
                  src={session.user.image || undefined}
                  alt={session.user.name || "User"}
                />
                <AvatarFallback className="text-sm font-medium">
                  {session.user.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="leading-tight">
                <p className="font-semibold">
                  {getDisplayName({
                    username: session.user.username,
                    displayName: session.user.name,
                  })}
                </p>
                {session.user.name !== session.user.username && (
                  <p className="text-muted-foreground text-sm">
                    @{session.user.username}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Cog /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <Button variant="outline" onClick={handleSignIn} disabled={isLoading}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        className="size-4"
      >
        <path
          d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
          fill="currentColor"
        />
      </svg>
      {isLoading ? "Signing In..." : "Login with GitHub"}
    </Button>
  );
}
