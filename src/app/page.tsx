import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Trophy,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow flex justify-center items-center p-12">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <Image
              src="/logo.svg"
              alt="Splitrail Leaderboard"
              width={300}
              height={300}
              className="mb-4"
            />

            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-[#01411E]">
              Agentic AI development monitor for the command line
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-4">
              Instantly hunt down and aggregate usage stats for all your agentic
              AI developement tools: Claude Code, Gemini CLI*, Codex*, and more.
              (A local web-based view coming soon!)
            </p>
            <p className="text-sm text-muted-foreground/70 mb-8">
              *Support for Codex and Gemini CLI is in development, but waiting for
              updates from OpenAI&apos;s/Google&apos;s side.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                className="group !px-5 rounded-lg h-10 text-md bg-gradient-to-br from-primary to-[#307850]"
              >
                <Link href="https://splitrail.dev/leaderboard">
                  <Trophy className="h-4 w-4 mr-2" />
                  Leaderboard{" "}
                  <ArrowRight className="h-9 w-9 group-hover:translate-x-1 transition translate" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="group !px-5 rounded-lg h-10 text-md"
              >
                <Link href="https://github.com/piebald-ai/splitrail">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-4 h-4 mr-2"
                  >
                    <path
                      d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                      fill="currentColor"
                    />
                  </svg>
                  View on GitHub
                </Link>
              </Button>
            </div>
          </div>
          <div>
            <Link href="https://github.com/piebald-ai/splitrail">
              <img
                src="/cli.png"
                alt="Splitrail Dashboard"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            </Link>
          </div>
        </div>
      </main>
      <footer className="px-12 py-4">
        <p className="text-sm text-muted-foreground/60 flex items-center">
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
      </footer>
    </div>
  );
}
