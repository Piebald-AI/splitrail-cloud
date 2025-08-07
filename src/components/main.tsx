"use client";

import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const Main = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <main
      className={cn(
        "h-full",
        pathname === "/" && !session
          ? ""
          : "min-h-0 overflow-auto container mx-auto px-6 py-12 flex-col"
      )}
    >
      {children}
    </main>
  );
};

export default Main;
