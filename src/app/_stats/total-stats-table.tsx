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
import { type StatsData } from "./types";

export function TotalStatsTable({
  statsData,
  formatConvertedCurrency,
}: {
  statsData: StatsData;
  formatConvertedCurrency: (amount: number) => string;
}) {
  const totals = statsData?.stats?.totals ?? {};
  const apps = (Object.keys(totals) as ApplicationType[]).filter(
    (app) => Number(totals[app]?.conversations ?? 0) > 0
  );

  if (apps.length === 0) return null;

  const grandRow = apps.reduce(
    (acc, app) => {
      const row = totals[app];
      return {
        cost: acc.cost + (row?.cost ?? 0),
        cachedTokens: acc.cachedTokens + Number(row?.cachedTokens ?? 0),
        inputTokens: acc.inputTokens + Number(row?.inputTokens ?? 0),
        outputTokens: acc.outputTokens + Number(row?.outputTokens ?? 0),
        reasoningTokens:
          acc.reasoningTokens + Number(row?.reasoningTokens ?? 0),
        conversations: acc.conversations + Number(row?.conversations ?? 0),
        toolCalls: acc.toolCalls + Number(row?.toolCalls ?? 0),
        terminalCommands:
          acc.terminalCommands + Number(row?.terminalCommands ?? 0),
        searches:
          acc.searches +
          Number(row?.fileSearches ?? 0) +
          Number(row?.fileContentSearches ?? 0),
        filesRead: acc.filesRead + Number(row?.filesRead ?? 0),
        filesAdded: acc.filesAdded + Number(row?.filesAdded ?? 0),
        filesEdited: acc.filesEdited + Number(row?.filesEdited ?? 0),
        filesDeleted: acc.filesDeleted + Number(row?.filesDeleted ?? 0),
        linesAdded: acc.linesAdded + Number(row?.linesAdded ?? 0),
        linesEdited: acc.linesEdited + Number(row?.linesEdited ?? 0),
      };
    },
    {
      cost: 0,
      cachedTokens: 0,
      inputTokens: 0,
      outputTokens: 0,
      reasoningTokens: 0,
      conversations: 0,
      toolCalls: 0,
      terminalCommands: 0,
      searches: 0,
      filesRead: 0,
      filesAdded: 0,
      filesEdited: 0,
      filesDeleted: 0,
      linesAdded: 0,
      linesEdited: 0,
    }
  );

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
                    Number(row?.fileSearches ?? 0) +
                      Number(row?.fileContentSearches ?? 0)
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
        <TableFooter>
          <TableRow>
            <TableCell className="font-medium">Total</TableCell>
            <TableCell className="font-mono text-amber-600 dark:text-amber-400">
              {formatConvertedCurrency(grandRow.cost)}
            </TableCell>
            <TableCell>{formatLargeNumber(grandRow.cachedTokens)}</TableCell>
            <TableCell>{formatLargeNumber(grandRow.inputTokens)}</TableCell>
            <TableCell>{formatLargeNumber(grandRow.outputTokens)}</TableCell>
            <TableCell>{formatLargeNumber(grandRow.reasoningTokens)}</TableCell>
            <TableCell>{formatLargeNumber(grandRow.conversations)}</TableCell>
            <TableCell className="text-green-600">
              {formatLargeNumber(grandRow.toolCalls)}
            </TableCell>
            <TableCell>{formatLargeNumber(grandRow.terminalCommands)}</TableCell>
            <TableCell>{formatLargeNumber(grandRow.searches)}</TableCell>
            <TableCell>
              {formatLargeNumber(grandRow.filesRead)}/
              {formatLargeNumber(grandRow.filesAdded)}/
              {formatLargeNumber(grandRow.filesEdited)}/
              {formatLargeNumber(grandRow.filesDeleted)}
            </TableCell>
            <TableCell>
              {formatLargeNumber(grandRow.linesAdded)}/
              {formatLargeNumber(grandRow.linesEdited)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
