"use client";

import { useEffect, useState } from "react";
import type { StatsFreshness } from "@/types";

export function StatsFreshnessNotice({
  freshness,
}: {
  freshness?: StatsFreshness;
}) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const refreshed = freshness?.lastRefreshedAt;
  const minutes =
    refreshed && now !== null
      ? Math.max(0, Math.floor((now - new Date(refreshed).getTime()) / 60_000))
      : null;
  const delayed = freshness?.pending && minutes !== null && minutes >= 30;
  const updated = !refreshed
    ? "Waiting for the first stats update"
    : minutes === null
      ? "Stats updated"
      : minutes < 1
        ? "Updated just now"
        : `Updated ${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;

  return (
    <p
      className="text-sm text-muted-foreground"
      title={
        refreshed
          ? `Summary snapshot: ${new Date(refreshed).toISOString()}`
          : undefined
      }
    >
      {updated} ·{" "}
      {delayed
        ? "Updates are delayed"
        : "Refreshes every 15 minutes when data changes"}
      {freshness?.pending && !delayed && (
        <span>
          {" "}
          · Recent uploads and deletions will appear after the next refresh.
        </span>
      )}
    </p>
  );
}
