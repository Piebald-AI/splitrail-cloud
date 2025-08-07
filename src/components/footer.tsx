"use client";

import Link from "next/link";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

function Footer() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <footer
      className={cn(
        "justify-between text-sm flex flex-row py-2",
        pathname === "/" && !session ? "px-12" : "px-6 container mx-auto"
      )}
    >
      <p className="flex items-center text-muted-foreground">
        <span>From the creators of&nbsp;&nbsp;</span>
        <Link
          href="https://piebald.ai"
          className="hover:text-muted-foreground transition-colors inline-flex items-center gap-1"
        >
          <Image src="/piebald.svg" alt="Piebald" width={24} height={24} />
          <span className="font-bold text-foreground">Piebald</span>
        </Link>
        <span>&nbsp;&bull; © 2025 Piebald, LLC.</span>
      </p>
      <div className="text-muted-foreground flex flex-row gap-1.5 items-center">
        <svg
          className="size-4.5"
          viewBox="0 0 19 19"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9.5 0.230011C4.25125 0.230011 0 4.48364 0 9.73001C0 13.9282 2.72175 17.4883 6.49563 18.7431C6.97062 18.8326 7.14479 18.5389 7.14479 18.2863C7.14479 18.0607 7.13688 17.463 7.13292 16.6713C4.49033 17.2445 3.933 15.3968 3.933 15.3968C3.50075 14.3003 2.87613 14.0074 2.87613 14.0074C2.01558 13.4184 2.94263 13.4303 2.94263 13.4303C3.89658 13.4968 4.39771 14.4088 4.39771 14.4088C5.24479 15.8615 6.6215 15.4419 7.16458 15.1988C7.25008 14.5845 7.49471 14.1657 7.76625 13.9282C5.65646 13.6907 3.439 12.8737 3.439 9.23364C3.439 8.19655 3.80713 7.34947 4.41671 6.68447C4.30983 6.44459 3.98921 5.47876 4.49983 4.17014C4.49983 4.17014 5.29546 3.91522 7.11233 5.14389C7.87233 4.93251 8.67983 4.82801 9.48733 4.82326C10.2948 4.82801 11.1023 4.93251 11.8623 5.14389C13.6673 3.91522 14.463 4.17014 14.463 4.17014C14.9736 5.47876 14.653 6.44459 14.558 6.68447C15.1636 7.34947 15.5317 8.19655 15.5317 9.23364C15.5317 12.8832 13.3111 13.6868 11.1973 13.9203C11.5298 14.2053 11.8386 14.788 11.8386 15.6778C11.8386 16.9492 11.8267 17.9705 11.8267 18.2792C11.8267 18.5286 11.993 18.8255 12.4798 18.7305C16.2806 17.4844 19 13.9219 19 9.73001C19 4.48364 14.7464 0.230011 9.5 0.230011Z"
            fill="currentColor"
          />
        </svg>
        <span>GitHub:</span>
        <Link
          href="https://github.com/Piebald-AI/splitrail"
          className="text-primary font-medium flex flex-row gap-1.5"
        >
          Splitrail
          <ExternalLink className="text-muted-foreground/50 size-4" />
        </Link>
        <span>&bull;</span>
        <Link
          href="https://github.com/Piebald-AI/splitrail-cloud"
          className="text-primary font-medium flex flex-row gap-1.5"
        >
          Cloud
          <ExternalLink className="text-muted-foreground/50 size-4" />
        </Link>
      </div>
    </footer>
  );
}

export default Footer;
