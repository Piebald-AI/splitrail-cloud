"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Plus,
  Terminal,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ApiToken {
  id: string;
  token: string;
  name: string;
  lastUsed: string | null;
  createdAt: string;
}

export function CLITokenDisplay() {
  const { data: session } = useSession();
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [visibleTokens, setVisibleTokens] = useState<Set<string>>(new Set());
  const [copiedTokens, setCopiedTokens] = useState<Set<string>>(new Set());
  const [newTokenName, setNewTokenName] = useState("");
  const [creatingToken, setCreatingToken] = useState(false);
  // Removed local alert message state in favor of Sonner toasts

  const fetchTokens = useCallback(async () => {
    if (!session) return;

    setLoading(true);
    try {
      const response = await fetch("/api/user/token");
      const data = await response.json();

      if (data.success) {
        setTokens(data.data.tokens);
      } else {
        toast.error(data.error || "Failed to fetch tokens");
      }
    } catch (error) {
      console.error("Error fetching tokens:", error);
      toast.error("Failed to fetch tokens");
    } finally {
      setLoading(false);
    }
  }, [session]);

  const createNewToken = async () => {
    if (!session) return;

    setCreatingToken(true);
    try {
      const response = await fetch("/api/user/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newTokenName || undefined }),
      });
      const data = await response.json();

      if (data.success) {
        setTokens((prev) => [data.data.token, ...prev]);
        setVisibleTokens((prev) => new Set([...prev, data.data.token.id]));
        setNewTokenName("");
        toast.success("Token created successfully!");
      } else {
        toast.error(data.error || "Failed to create token");
      }
    } catch (error) {
      console.error("Error creating token:", error);
      toast.error("Failed to create token");
    } finally {
      setCreatingToken(false);
    }
  };

  const deleteToken = async (tokenId: string) => {
    if (!session) return;

    try {
      const response = await fetch(`/api/user/token?tokenId=${tokenId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        setTokens((prev) => prev.filter((t) => t.id !== tokenId));
        setVisibleTokens((prev) => {
          const newSet = new Set(prev);
          newSet.delete(tokenId);
          return newSet;
        });
        toast.success("Token deleted successfully!");
      } else {
        toast.error(data.error || "Failed to delete token");
      }
    } catch (error) {
      console.error("Error deleting token:", error);
      toast.error("Failed to delete token");
    }
  };

  const copyToken = async (token: string, tokenId: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(token);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = token;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopiedTokens((prev) => new Set([...prev, tokenId]));
      setTimeout(() => {
        setCopiedTokens((prev) => {
          const newSet = new Set(prev);
          newSet.delete(tokenId);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error("Failed to copy token:", error);
    }
  };

  const toggleTokenVisibility = (tokenId: string) => {
    setVisibleTokens((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tokenId)) {
        newSet.delete(tokenId);
      } else {
        newSet.add(tokenId);
      }
      return newSet;
    });
  };

  const maskToken = (token: string) => {
    if (token.length <= 4) return token;
    return "•".repeat(token.length - 4) + token.slice(-4);
  };

  useEffect(() => {
    if (session) {
      fetchTokens();
    } else {
      setLoading(false);
    }
  }, [session, fetchTokens]);

  // Removed message effect as Sonner toasts handle their own lifecycle
  const latestToken = tokens[0]?.token;
  const setApiTokenCommand = latestToken
    ? `splitrail config set api-token ${latestToken}`
    : "splitrail config set api-token <your-token>";
  const enableAutoUploadCommand = "splitrail config set auto-upload true";
  const uploadCommand = "splitrail upload";

  if (!session) {
    return (
      <div className="space-y-4">
        <div className="text-center p-8 text-muted-foreground">
          Sign in to manage your API tokens for the Splitrail CLI.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-muted/30 p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Configure Splitrail CLI anytime</p>
            <p className="text-xs text-muted-foreground">
              Keep your CLI linked, then reuse this guide whenever you create and
              switch to a new token.
            </p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Terminal className="h-4 w-4" />
                Configure CLI
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl max-w-min">
              <DialogHeader>
                <DialogTitle>Splitrail CLI setup</DialogTitle>
                <DialogDescription>
                  Use this quick setup anytime. When you create a new token here,
                  reopen this and copy the set-token command again.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <ol className="list-decimal space-y-4 pl-5">
                  <li className="space-y-2">
                    <p>
                      Install the CLI from{" "}
                      <a
                        href="https://github.com/Piebald-AI/splitrail/releases"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        GitHub
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      .
                    </p>
                  </li>
                  <li className="space-y-2">
                    <p>Set your API token:</p>
                    <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-2">
                      <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs">
                        {setApiTokenCommand}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToken(setApiTokenCommand, "cmd-set-api-token")
                        }
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        {copiedTokens.has("cmd-set-api-token")
                          ? "Copied!"
                          : "Copy"}
                      </Button>
                    </div>
                    {!latestToken && (
                      <p className="text-xs text-muted-foreground">
                        Create a token first, then copy this command with your
                        real token value.
                      </p>
                    )}
                  </li>
                  <li className="space-y-2">
                    <p>Optional: enable auto-upload:</p>
                    <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-2">
                      <code className="flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs">
                        {enableAutoUploadCommand}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          copyToken(enableAutoUploadCommand, "cmd-auto-upload")
                        }
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        {copiedTokens.has("cmd-auto-upload")
                          ? "Copied!"
                          : "Copy"}
                      </Button>
                    </div>
                  </li>
                </ol>
                <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                  Manual upload command:{" "}
                  <code className="font-mono">{uploadCommand}</code>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Create New Token */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Token name (optional)"
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
              disabled={creatingToken}
            />
          </div>
          <Button
            onClick={createNewToken}
            disabled={creatingToken || tokens.length >= 50}
          >
            <Plus className="h-4 w-4 mr-2" />
            {creatingToken ? "Creating..." : "Create Token"}
          </Button>
        </div>

        {tokens.length >= 50 && (
          <p className="text-sm text-muted-foreground">
            Maximum of 50 tokens reached. Delete some tokens to create new ones.
          </p>
        )}

        <p className="text-sm text-muted-foreground">
          You have {tokens.length} of 50 maximum tokens.
        </p>
      </div>

      {/* Token List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="text-muted-foreground">Loading tokens...</div>
        </div>
      ) : tokens.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No tokens created yet. Create your first token above.
        </div>
      ) : (
        <div className="space-y-3">
          <Label className="text-base font-medium">Your API Tokens:</Label>

          {tokens.map((token) => {
            const isVisible = visibleTokens.has(token.id);
            const isCopied = copiedTokens.has(token.id);

            return (
              <Card key={token.id} className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium text-sm">{token.name}</span>
                      <span className="text-xs text-muted-foreground">
                        Created {formatDate(token.createdAt, "PPP")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        value={isVisible ? token.token : maskToken(token.token)}
                        readOnly
                        className="flex-1 font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleTokenVisibility(token.id)}
                      >
                        {isVisible ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToken(token.token, token.id)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        {isCopied ? "Copied!" : "Copy"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteToken(token.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {token.lastUsed && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last used: {formatDate(token.lastUsed, "PPPpp")}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
