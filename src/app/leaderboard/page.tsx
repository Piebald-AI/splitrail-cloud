"use client";

import { columns } from "../leaderboard-columns";
import { DataTable } from "../leaderboard-data-table";
import { useState, useEffect } from "react";
import type { UserWithStats } from "@/types";

function LoadingSkeleton() {
  return (
    <div className="container mx-auto p-6">
      <div className="text-center mb-8">
        <div className="h-10 w-80 bg-muted rounded mx-auto mb-2"></div>
        <div className="h-5 w-96 bg-muted rounded mx-auto"></div>
      </div>

      <div className="w-full">
        <div className="flex items-center py-4">
          <div className="h-10 w-64 bg-muted rounded"></div>
          <div className="h-10 w-32 bg-muted rounded ml-auto"></div>
        </div>
        <div className="rounded-md border bg-card">
          <div className="border-b h-12 bg-muted/30"></div>
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="border-b h-16 bg-muted/10 animate-pulse"
            ></div>
          ))}
        </div>
        <div className="flex items-center justify-center py-4">
          <div className="h-10 w-96 bg-muted rounded"></div>
        </div>
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const [allUsers, setAllUsers] = useState<UserWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/leaderboard');
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard data');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setAllUsers(data.data?.users || []);
      } else {
        throw new Error(data.error || 'Failed to fetch leaderboard data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-destructive">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Splitrail Leaderboard</h1>
        <p className="text-muted-foreground">
          Competitive rankings for developers using agentic workflow tools.
        </p>
      </div>

      {allUsers.length === 0 ? (
        <div className="text-center text-muted-foreground">
          <p>
            No users found. Start using Claude Code with Splitrail to appear on
            the leaderboard!
          </p>
        </div>
      ) : (
        <DataTable columns={columns} data={allUsers} />
      )}
    </div>
  );
}
