import { Code } from "@/components/ui/code";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Rocket } from "lucide-react";
import Link from "next/link";

export function SetupInstructions() {
  return (
    <Alert>
      <Rocket />
      <AlertTitle>Get Started with Splitrail</AlertTitle>
      <AlertDescription>
        <p className="mb-3">
          You haven&rsquo;t uploaded any data yet. To start tracking your
          agentic development tool usage:
        </p>
        <ol className="list-decimal list-inside space-y-1 ml-2">
          <li>
            Install Splitrail CLI from{" "}
            <a
              href="https://github.com/Piebald-AI/splitrail/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              GitHub
            </a>
            .
          </li>
          <li>
            Go to{" "}
            <Link href="/settings" className="text-primary hover:underline">
              Settings
            </Link>{" "}
            to create an API token.
          </li>
          <li>
            Set your API token by running{" "}
            <Code variant="inline">
              splitrail config set api-token &lt;your-token&gt;
            </Code>
            .
          </li>
          <li>
            Enable auto-uploading with{" "}
            <Code variant="inline">
              splitrail config set auto-upload true
            </Code>
            , or manually run{" "}
            <Code variant="inline">splitrail upload</Code>.
          </li>
        </ol>
      </AlertDescription>
    </Alert>
  );
}
