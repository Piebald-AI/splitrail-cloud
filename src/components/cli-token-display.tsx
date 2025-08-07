"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Eye, EyeOff, Copy, Plus } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

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
