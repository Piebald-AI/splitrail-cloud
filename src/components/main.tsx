"use client";

import { usePathname } from "next/navigation";

const Main = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  return (
    <main
      className={
        pathname !== "/"
          ? "h-full min-h-0 overflow-auto container mx-auto p-6 flex-col"
          : ""
      }
    >
      {children}
    </main>
  );
};

export default Main;
