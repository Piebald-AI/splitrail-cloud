import { Code } from "@/components/ui/code";
import Link from "next/link";

export function SetupInstructions() {
  return (
    <div className="space-y-2">
      <p>
        You don&rsquo;t have any agentic development tool data. Once you start
        using Claude Code / Codex CLI / Gemini CLI / Qwen Code / Cline / Roo
        Code / Kilo Code / GitHub Copilot / OpenCode / Pi Agent / Piebald, you
        can get started by following these steps:
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
          If you want to use auto-uploading, run{" "}
          <Code variant="inline">splitrail config set auto-upload true</Code>{" "}
          and then run <Code variant="inline">splitrail</Code> normally.
          Otherwise just run <Code variant="inline">splitrail upload</Code>.
        </li>
      </ol>
    </div>
  );
}
