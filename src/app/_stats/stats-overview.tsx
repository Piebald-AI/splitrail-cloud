"use client";

import * as React from "react";
import { formatDate, formatLargeNumber } from "@/lib/utils";
import { APPLICATION_LABELS } from "@/lib/application-config";
import { TZDateMini } from "@date-fns/tz";
import {
  CalendarCheck,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  FileText,
  Gauge,
  Hammer,
  Search,
  SquareTerminal,
  WholeWord,
} from "lucide-react";
import { StatCard } from "./stat-card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { type DayStat, type GrandTotal } from "./types";

const utc = (date: string) => new TZDateMini(date, "UTC");

export function StatsOverview({
  grandTotal,
  appTotals,
  formatConvertedCurrency,
  formatConvertedCurrencyAdaptive,
}: {
  grandTotal: GrandTotal;
  appTotals: Record<string, DayStat>;
  formatConvertedCurrency: (amount: number) => string;
  formatConvertedCurrencyAdaptive: (amount: number) => string;
}) {
  const [showAdvancedInsights, setShowAdvancedInsights] = React.useState(false);
  const sortedAppLabels = Object.entries(appTotals)
    .filter(([, total]) => Number(total.conversations ?? 0) > 0)
    .sort(
      ([, a], [, b]) => Number(b.conversations ?? 0) - Number(a.conversations ?? 0)
    )
    .map(([app]) => APPLICATION_LABELS[app as keyof typeof APPLICATION_LABELS] ?? app);

  const fallbackLabels = grandTotal.applications.map(
    (app) => APPLICATION_LABELS[app as keyof typeof APPLICATION_LABELS] ?? app
  );
  const appLabels = sortedAppLabels.length > 0 ? sortedAppLabels : fallbackLabels;
  const visibleAppLabels = appLabels.slice(0, 2);
  const remainingAppLabels = appLabels.slice(2);
  const daysTracked = Math.max(grandTotal.daysTracked, 1);
  const filesTouched =
    grandTotal.filesRead +
    grandTotal.filesAdded +
    grandTotal.filesEdited +
    grandTotal.filesDeleted;
  const totalSearches =
    grandTotal.fileSearches + grandTotal.fileContentSearches;
  const costPer1kTokens =
    grandTotal.tokens > 0 ? (grandTotal.cost / grandTotal.tokens) * 1000 : 0;
  const cacheTokenTotal = grandTotal.cacheCreationTokens + grandTotal.cacheReadTokens;
  const cacheReuseRate =
    cacheTokenTotal > 0 ? (grandTotal.cacheReadTokens / cacheTokenTotal) * 100 : 0;
  const tokensPerToolCall =
    grandTotal.toolCalls > 0 ? grandTotal.tokens / grandTotal.toolCalls : 0;
  const toolCallsPerConversation =
    grandTotal.conversations > 0
      ? grandTotal.toolCalls / grandTotal.conversations
      : 0;
  const writeActions = grandTotal.filesAdded + grandTotal.filesEdited + grandTotal.filesDeleted;
  const writeShare = filesTouched > 0 ? (writeActions / filesTouched) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <StatCard
          Icon={WholeWord}
          label="Tokens"
          value={formatLargeNumber(grandTotal.tokens)}
          info={`${formatLargeNumber(grandTotal.tokens / daysTracked)}/day avg`}
          accent="violet"
        />
        <StatCard
          Icon={CircleDollarSign}
          label="Cost"
          value={formatConvertedCurrency(grandTotal.cost)}
          info={`${formatConvertedCurrency(grandTotal.cost / daysTracked)}/day avg`}
          accent="amber"
        />
        <StatCard
          Icon={Hammer}
          label="Tool Calls"
          value={formatLargeNumber(grandTotal.toolCalls)}
          info={`${formatLargeNumber(grandTotal.toolCalls / daysTracked)}/day avg`}
          accent="emerald"
        />
        <StatCard
          Icon={CalendarCheck}
          label="Days Tracked"
          value={formatLargeNumber(grandTotal.daysTracked)}
          info={`${formatDate(utc(grandTotal.firstDate), "MMM d, yyyy")} — ${formatDate(utc(grandTotal.lastDate), "MMM d, yyyy")}`}
          accent="sky"
        />
        <StatCard
          Icon={SquareTerminal}
          label="Applications"
          value={formatLargeNumber(grandTotal.numApps)}
          info={
            appLabels.length === 0 ? (
              ""
            ) : (
              <>
                {visibleAppLabels.join(", ")}
                {remainingAppLabels.length > 0 && (
                  <>
                    {" "}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help underline decoration-dotted underline-offset-2">
                          +{remainingAppLabels.length} more
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={6}>
                        {remainingAppLabels.join(", ")}
                      </TooltipContent>
                    </Tooltip>
                  </>
                )}
              </>
            )
          }
          accent="teal"
        />
      </div>

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvancedInsights((prev) => !prev)}
          className="gap-2"
        >
          {showAdvancedInsights ? "Hide advanced insights" : "Show advanced insights"}
          {showAdvancedInsights ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </Button>
      </div>

      {showAdvancedInsights && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            Icon={Gauge}
            label="Cache Reuse"
            value={`${cacheReuseRate.toFixed(1)}%`}
            info={`${formatLargeNumber(grandTotal.cacheReadTokens)} read / ${formatLargeNumber(cacheTokenTotal)} total`}
            accent="violet"
          />
          <StatCard
            Icon={Gauge}
            label="Cost / 1K Tok"
            value={formatConvertedCurrencyAdaptive(costPer1kTokens)}
            info="Efficiency indicator"
            accent="teal"
          />
          <StatCard
            Icon={FileText}
            label="Files Touched"
            value={formatLargeNumber(filesTouched)}
            info={`${formatLargeNumber(filesTouched / daysTracked)}/day avg`}
            accent="sky"
          />
          <StatCard
            Icon={SquareTerminal}
            label="Terminal Cmds"
            value={formatLargeNumber(grandTotal.terminalCommands)}
            info={`${formatLargeNumber(grandTotal.terminalCommands / daysTracked)}/day avg`}
            accent="teal"
          />
          <StatCard
            Icon={Search}
            label="Searches"
            value={formatLargeNumber(totalSearches)}
            info={`${formatLargeNumber(totalSearches / daysTracked)}/day avg`}
            accent="sky"
          />
          <StatCard
            Icon={Hammer}
            label="Tokens / Tool Call"
            value={formatLargeNumber(tokensPerToolCall)}
            info="Throughput per action"
            accent="emerald"
          />
          <StatCard
            Icon={SquareTerminal}
            label="Calls / Conversation"
            value={toolCallsPerConversation.toFixed(1)}
            info="Automation depth"
            accent="teal"
          />
          <StatCard
            Icon={FileText}
            label="Write Share"
            value={`${writeShare.toFixed(1)}%`}
            info={`${formatLargeNumber(writeActions)} write actions`}
            accent="amber"
          />
        </div>
      )}
    </div>
  );
}
