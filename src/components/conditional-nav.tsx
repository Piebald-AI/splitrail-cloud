"use client";

import { usePathname } from "next/navigation";
import { MainNav } from "./main-nav";

export function ConditionalNav() {
  const pathname = usePathname();
  
  if (pathname === "/") {
    return null;
  }
  
  return <MainNav />;
}