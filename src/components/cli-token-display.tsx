"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
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
  const queryClient = useQueryClient();
  const [visibleTokens, setVisibleTokens] = useState<Set<string>>(new Set());
  const [copiedTokens, setCopiedTokens] = useState<Set<string>>(new Set());
  const [newTokenName, setNewTokenName] = useState("");
  const {
    data: tokens = [],
    isLoading,
    isError,
    error,
  } = useQuery<ApiToken[]>({
    queryKey: ["apiTokens", session?.user?.id],
    queryFn: async () => {
      const response = await fetch("/api/user/token");
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch tokens");
      }
      return data.data.tokens as ApiToken[];
    },
    enabled: !!session,
  });

  const createTokenMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await fetch("/api/user/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: name || undefined }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create token");
      }
      return data.data.token as ApiToken;
    },
    onSuccess: async (token) => {
      await queryClient.invalidateQueries({
        queryKey: ["apiTokens", session?.user?.id],
      });
      setVisibleTokens((prev) => new Set([...prev, token.id]));
      setNewTokenName("");
      toast.success("Token created successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create token");
    },
  });

  const deleteTokenMutation = useMutation({
    mutationFn: async (tokenId: string) => {
      const response = await fetch(`/api/user/token?tokenId=${tokenId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to delete token");
      }
      return tokenId;
    },
    onSuccess: async (tokenId) => {
      await queryClient.invalidateQueries({
        queryKey: ["apiTokens", session?.user?.id],
      });
      setVisibleTokens((prev) => {
        const next = new Set(prev);
        next.delete(tokenId);
        return next;
      });
      toast.success("Token deleted successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete token");
    },
  });

  const createNewToken = async () => {
    if (!session) return;
    await createTokenMutation.mutateAsync(newTokenName);
  };

  const deleteToken = async (tokenId: string) => {
    if (!session) return;
    await deleteTokenMutation.mutateAsync(tokenId);
  };

  const copyToken = async (token: string, tokenId: string) => {
    try {
      await navigator.clipboard.writeText(token);
      setCopiedTokens((prev) => new Set([...prev, tokenId]));
      toast.success("Copied to clipboard");
      setTimeout(() => {
        setCopiedTokens((prev) => {
          const newSet = new Set(prev);
          newSet.delete(tokenId);
          return newSet;
        });
      }, 2000);
    } catch (error) {
      console.error("Failed to copy token:", error);
      toast.error("Failed to copy token");
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
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Splitrail CLI setup</DialogTitle>
                <DialogDescription>
                  Use this quick setup anytime. When you create a new token here,
                  reopen this and copy the set-token command again.
                </DialogDescription>
              </DialogHeader>

              <div className="min-w-0 space-y-4 text-sm">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p>
                      1. Install the CLI from{" "}
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
                  </div>
                  <div className="space-y-2">
                    <p>2. Set your API token:</p>
                    <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-2">
                      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs">
                        {setApiTokenCommand}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0"
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
                  </div>
                  <div className="space-y-2">
                    <p>3. Optional: enable auto-upload:</p>
                    <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-2">
                      <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap font-mono text-xs">
                        {enableAutoUploadCommand}
                      </code>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0"
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
                  </div>
                </div>
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
              disabled={createTokenMutation.isPending}
            />
          </div>
          <Button
            onClick={createNewToken}
            disabled={createTokenMutation.isPending || tokens.length >= 50}
          >
            <Plus className="h-4 w-4 mr-2" />
            {createTokenMutation.isPending ? "Creating..." : "Create Token"}
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
      {isLoading ? (
        <div className="text-center py-8">
          <div className="text-muted-foreground">Loading tokens...</div>
        </div>
      ) : isError ? (
        <div className="text-center py-8 text-destructive">
          {(error as Error)?.message || "Failed to load tokens."}
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
                        disabled={deleteTokenMutation.isPending}
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
