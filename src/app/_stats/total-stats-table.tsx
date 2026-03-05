"use client";

import { formatLargeNumber } from "@/lib/utils";
import { APPLICATION_LABELS } from "@/lib/application-config";
import { type ApplicationType } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  addCounterValues,
  isPositiveCounter,
  type StatsData,
} from "./types";

export function TotalStatsTable({
  statsData,
  formatConvertedCurrency,
}: {
  statsData: StatsData;
  formatConvertedCurrency: (amount: number) => string;
}) {
  const totals = statsData?.stats?.totals ?? {};
  const grandTotal = statsData?.stats?.grandTotal;
  const apps = (Object.keys(totals) as ApplicationType[]).filter(
    (app) => isPositiveCounter(totals[app]?.conversations)
  );

  if (apps.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Source</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead>Cached Tokens</TableHead>
            <TableHead>Input Tokens</TableHead>
            <TableHead>Output Tokens</TableHead>
            <TableHead>Reasoning</TableHead>
            <TableHead>Conversations</TableHead>
            <TableHead>Tool Calls</TableHead>
            <TableHead>Terminal</TableHead>
            <TableHead>Searches</TableHead>
            <TableHead>Files R/A/E/D</TableHead>
            <TableHead>Lines +/~</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {apps.map((app) => {
            const row = totals[app];
            return (
              <TableRow key={app}>
                <TableCell className="font-medium">
                  {APPLICATION_LABELS[app]}
                </TableCell>
                <TableCell className="font-mono text-amber-600 dark:text-amber-400">
                  {formatConvertedCurrency(row?.cost ?? 0)}
                </TableCell>
                <TableCell>
                  {formatLargeNumber(row?.cachedTokens ?? 0)}
                </TableCell>
                <TableCell>
                  {formatLargeNumber(row?.inputTokens ?? 0)}
                </TableCell>
                <TableCell>
                  {formatLargeNumber(row?.outputTokens ?? 0)}
                </TableCell>
                <TableCell>
                  {formatLargeNumber(row?.reasoningTokens ?? 0)}
                </TableCell>
                <TableCell>
                  {formatLargeNumber(row?.conversations ?? 0)}
                </TableCell>
                <TableCell className="text-green-600">
                  {formatLargeNumber(row?.toolCalls ?? 0)}
                </TableCell>
                <TableCell>
                  {formatLargeNumber(row?.terminalCommands ?? 0)}
                </TableCell>
                <TableCell>
                  {formatLargeNumber(
                    addCounterValues(
                      row?.fileSearches,
                      row?.fileContentSearches
                    )
                  )}
                </TableCell>
                <TableCell>
                  {formatLargeNumber(row?.filesRead ?? 0)}/
                  {formatLargeNumber(row?.filesAdded ?? 0)}/
                  {formatLargeNumber(row?.filesEdited ?? 0)}/
                  {formatLargeNumber(row?.filesDeleted ?? 0)}
                </TableCell>
                <TableCell>
                  {formatLargeNumber(row?.linesAdded ?? 0)}/
                  {formatLargeNumber(row?.linesEdited ?? 0)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        {grandTotal ? (
          <TableFooter>
            <TableRow>
              <TableCell className="font-medium">Total</TableCell>
              <TableCell className="font-mono text-amber-600 dark:text-amber-400">
                {formatConvertedCurrency(grandTotal.cost)}
              </TableCell>
              <TableCell>{formatLargeNumber(grandTotal.cachedTokens)}</TableCell>
              <TableCell>{formatLargeNumber(grandTotal.inputTokens)}</TableCell>
              <TableCell>{formatLargeNumber(grandTotal.outputTokens)}</TableCell>
              <TableCell>{formatLargeNumber(grandTotal.reasoningTokens)}</TableCell>
              <TableCell>{formatLargeNumber(grandTotal.conversations)}</TableCell>
              <TableCell className="text-green-600">
                {formatLargeNumber(grandTotal.toolCalls)}
              </TableCell>
              <TableCell>{formatLargeNumber(grandTotal.terminalCommands)}</TableCell>
              <TableCell>
                {formatLargeNumber(
                  addCounterValues(
                    grandTotal.fileSearches,
                    grandTotal.fileContentSearches
                  )
                )}
              </TableCell>
              <TableCell>
                {formatLargeNumber(grandTotal.filesRead)}/
                {formatLargeNumber(grandTotal.filesAdded)}/
                {formatLargeNumber(grandTotal.filesEdited)}/
                {formatLargeNumber(grandTotal.filesDeleted)}
              </TableCell>
              <TableCell>
                {formatLargeNumber(grandTotal.linesAdded)}/
                {formatLargeNumber(grandTotal.linesEdited)}
              </TableCell>
            </TableRow>
          </TableFooter>
        ) : null}
      </Table>
    </div>
  );
}
