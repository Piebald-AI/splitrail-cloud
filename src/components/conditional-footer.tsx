"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import Image from "next/image";

export function ConditionalFooter() {
  const pathname = usePathname();
  
  if (pathname === "/") {
    console.log("ConditionalFooter - about to return home footer JSX");
    const footerElement = (
      <div className="px-12 py-4">
        <p className="flex items-center text-muted-foreground">
          <span>From the creators of&nbsp;&nbsp;</span>
          <Link
            href="https://piebald.ai"
            className="hover:text-muted-foreground transition-colors inline-flex items-center gap-1"
          >
            <Image
              src="/piebald.svg"
              alt="Piebald"
              width={28}
              height={28}
            />
            <span className="font-bold text-foreground">Piebald</span>
          </Link>
          <span>&nbsp;&bull; © 2025 Piebald, LLC.</span>
        </p>
      </div>
    );
    console.log("ConditionalFooter - returning footer element:", footerElement);
    return footerElement;
  }
  
  return (
    <footer className="mt-auto">
      <Separator />
      <div className="container mx-auto px-6 py-8">
        <div className="text-center text-sm text-muted-foreground">
          <p>
            © 2025{" "}
            <Button
              variant="link"
              size="sm"
              asChild
              className="h-auto p-0"
            >
              <Link href="https://piebald.ai">Piebald, LLC.</Link>
            </Button>{" "}
            Inspiring developers to embrace agentic AI development.
          </p>
          <p className="mt-2">
            <Button
              variant="link"
              size="sm"
              asChild
              className="h-auto p-0"
            >
              <Link href="https://github.com/piebald-ai/splitrail">
                View Splitrail on GitHub
              </Link>
            </Button>
          </p>
        </div>
      </div>
    </footer>
  );
}