"use client";

import * as React from "react";
import { cn, formatLargeNumber } from "@/lib/utils";
import { APPLICATION_LABELS } from "@/lib/application-config";
import { type ApplicationType } from "@/types";
import { type StatsData } from "./types";

export type SelectedSource = "total" | ApplicationType;

function SourceBadge({
  label,
  count,
  isSelected,
  onClick,
}: {
  label: string;
  count?: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-150 cursor-pointer",
        "border",
        isSelected
          ? "bg-foreground text-background border-foreground"
          : "bg-transparent text-muted-foreground border-border hover:text-foreground hover:border-foreground/40"
      )}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            "font-mono text-xs",
            isSelected ? "opacity-60" : "opacity-50"
          )}
        >
          {formatLargeNumber(count)}
        </span>
      )}
    </button>
  );
}

export function SourceBadges({
  statsData,
  selectedSource,
  onSelectSource,
}: {
  statsData: StatsData;
  selectedSource: SelectedSource;
  onSelectSource: (source: SelectedSource) => void;
}) {
  const { appsWithData, totalConversations } = React.useMemo(() => {
    const totals = statsData?.stats?.totals ?? {};
    const appsWithData = (Object.keys(totals) as ApplicationType[]).filter(
      (app) => Number(totals[app]?.conversations ?? 0) > 0
    );
    const totalConversations = appsWithData.reduce(
      (sum, app) => sum + Number(totals[app]?.conversations ?? 0),
      0
    );
    return { appsWithData, totalConversations };
  }, [statsData]);

  return (
    <div className="flex flex-wrap gap-2">
      <SourceBadge
        label="All Sources"
        count={totalConversations}
        isSelected={selectedSource === "total"}
        onClick={() => onSelectSource("total")}
      />
      {appsWithData.map((app) => {
        const conversations = Number(
          statsData.stats?.totals?.[app]?.conversations ?? 0
        );
        return (
          <SourceBadge
            key={app}
            label={APPLICATION_LABELS[app]}
            count={conversations}
            isSelected={selectedSource === app}
            onClick={() => onSelectSource(app)}
          />
        );
      })}
    </div>
  );
}
