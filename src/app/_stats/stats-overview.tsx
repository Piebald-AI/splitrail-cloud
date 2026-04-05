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
import { StatCard } from "@/app/_stats/stat-card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  addCounterValues,
  compareCounterValues,
  counterToApproxNumber,
  isPositiveCounter,
  type GrandTotal,
  type TotalsRow,
} from "@/app/_stats/types";

const utc = (date: string) => new TZDateMini(date, "UTC");

export function StatsOverview({
  grandTotal,
  appTotals,
  formatConvertedCurrency,
  formatConvertedCurrencyAdaptive,
}: {
  grandTotal: GrandTotal;
  appTotals: Record<string, TotalsRow>;
  formatConvertedCurrency: (amount: number) => string;
  formatConvertedCurrencyAdaptive: (amount: number) => string;
}) {
  const [showAdvancedInsights, setShowAdvancedInsights] = React.useState(false);
  const sortedAppLabels = Object.entries(appTotals)
    .filter(([, total]) => isPositiveCounter(total.conversations))
    .sort(
      ([, a], [, b]) =>
        compareCounterValues(b.conversations, a.conversations)
    )
    .map(
      ([app]) =>
        APPLICATION_LABELS[app as keyof typeof APPLICATION_LABELS] ?? app
    );

  const fallbackLabels = grandTotal.applications.map(
    (app) => APPLICATION_LABELS[app as keyof typeof APPLICATION_LABELS] ?? app
  );
  const appLabels =
    sortedAppLabels.length > 0 ? sortedAppLabels : fallbackLabels;
  const visibleAppLabels = appLabels.slice(0, 2);
  const remainingAppLabels = appLabels.slice(2);
  const daysTracked = Math.max(grandTotal.daysTracked, 1);
  const filesTouched = addCounterValues(
    grandTotal.filesRead,
    grandTotal.filesAdded,
    grandTotal.filesEdited,
    grandTotal.filesDeleted
  );
  const totalSearches = addCounterValues(
    grandTotal.fileSearches,
    grandTotal.fileContentSearches
  );
  const cacheTokenTotal = addCounterValues(
    grandTotal.cacheCreationTokens,
    grandTotal.cacheReadTokens
  );
  const tokensApprox = counterToApproxNumber(grandTotal.tokens);
  const toolCallsApprox = counterToApproxNumber(grandTotal.toolCalls);
  const conversationsApprox = counterToApproxNumber(grandTotal.conversations);
  const terminalCommandsApprox = counterToApproxNumber(grandTotal.terminalCommands);
  const filesTouchedApprox = counterToApproxNumber(filesTouched);
  const totalSearchesApprox = counterToApproxNumber(totalSearches);
  const cacheReadTokensApprox = counterToApproxNumber(grandTotal.cacheReadTokens);
  const cacheTokenTotalApprox = counterToApproxNumber(cacheTokenTotal);
  const writeActions = addCounterValues(
    grandTotal.filesAdded,
    grandTotal.filesEdited,
    grandTotal.filesDeleted
  );
  const writeActionsApprox = counterToApproxNumber(writeActions);
  const costPer1kTokens =
    tokensApprox > 0 ? (grandTotal.cost / tokensApprox) * 1000 : 0;
  const cacheReuseRate =
    cacheTokenTotalApprox > 0
      ? (cacheReadTokensApprox / cacheTokenTotalApprox) * 100
      : 0;
  const tokensPerToolCall =
    toolCallsApprox > 0 ? tokensApprox / toolCallsApprox : 0;
  const toolCallsPerConversation =
    conversationsApprox > 0
      ? toolCallsApprox / conversationsApprox
      : 0;
  const writeShare =
    filesTouchedApprox > 0 ? (writeActionsApprox / filesTouchedApprox) * 100 : 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <StatCard
          Icon={WholeWord}
          label="Tokens"
          value={formatLargeNumber(grandTotal.tokens)}
          info={`${formatLargeNumber(tokensApprox / daysTracked)}/day avg`}
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
          info={`${formatLargeNumber(toolCallsApprox / daysTracked)}/day avg`}
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

      <button
        onClick={() => setShowAdvancedInsights((prev) => !prev)}
        className="flex w-full items-center gap-3 text-muted-foreground/50 hover:text-muted-foreground/80 transition-colors group py-0.5"
      >
        <span className="h-px flex-1 bg-border/40 group-hover:bg-border/70 transition-colors" />
        <span className="flex items-center gap-1.5 text-[11px] font-medium tracking-widest uppercase select-none">
          Advanced Insights
          {showAdvancedInsights ? (
            <ChevronUp className="size-3" />
          ) : (
            <ChevronDown className="size-3" />
          )}
        </span>
        <span className="h-px flex-1 bg-border/40 group-hover:bg-border/70 transition-colors" />
      </button>

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
            info={`${formatLargeNumber(filesTouchedApprox / daysTracked)}/day avg`}
            accent="sky"
          />
          <StatCard
            Icon={SquareTerminal}
            label="Terminal Cmds"
            value={formatLargeNumber(grandTotal.terminalCommands)}
            info={`${formatLargeNumber(terminalCommandsApprox / daysTracked)}/day avg`}
            accent="teal"
          />
          <StatCard
            Icon={Search}
            label="Searches"
            value={formatLargeNumber(totalSearches)}
            info={`${formatLargeNumber(totalSearchesApprox / daysTracked)}/day avg`}
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
