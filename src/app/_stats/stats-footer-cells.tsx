"use client";

import * as React from "react";
import { formatLargeNumber } from "@/lib/utils";
import { TableCell } from "@/components/ui/table";

type TotalsMetrics = {
  cachedTokens?: number | string | null;
  inputTokens?: number | string | null;
  outputTokens?: number | string | null;
  reasoningTokens?: number | string | null;
  conversations?: number | string | null;
  toolCalls?: number | string | null;
  terminalCommands?: number | string | null;
  fileSearches?: number | string | null;
  fileContentSearches?: number | string | null;
  filesRead?: number | string | null;
  filesAdded?: number | string | null;
  filesEdited?: number | string | null;
  filesDeleted?: number | string | null;
  linesRead?: number | string | null;
  linesAdded?: number | string | null;
  linesEdited?: number | string | null;
};

export function StatsFooterMetricCells({
  totals,
  lastCell,
}: {
  totals: TotalsMetrics;
  lastCell: React.ReactNode;
}) {
  return (
    <>
      <TableCell>{formatLargeNumber(Number(totals.cachedTokens ?? 0))}</TableCell>
      <TableCell>{formatLargeNumber(Number(totals.inputTokens ?? 0))}</TableCell>
      <TableCell>{formatLargeNumber(Number(totals.outputTokens ?? 0))}</TableCell>
      <TableCell>{formatLargeNumber(Number(totals.reasoningTokens ?? 0))}</TableCell>
      <TableCell>{formatLargeNumber(Number(totals.conversations ?? 0))}</TableCell>
      <TableCell className="text-green-600">
        {formatLargeNumber(Number(totals.toolCalls ?? 0))}
      </TableCell>
      <TableCell>
        {formatLargeNumber(Number(totals.terminalCommands ?? 0))}
      </TableCell>
      <TableCell>
        {formatLargeNumber(
          Number(totals.fileSearches ?? 0) + Number(totals.fileContentSearches ?? 0)
        )}
      </TableCell>
      <TableCell>
        {formatLargeNumber(Number(totals.filesRead ?? 0))}/
        {formatLargeNumber(Number(totals.filesAdded ?? 0))}/
        {formatLargeNumber(Number(totals.filesEdited ?? 0))}/
        {formatLargeNumber(Number(totals.filesDeleted ?? 0))}
      </TableCell>
      <TableCell>
        {formatLargeNumber(Number(totals.linesRead ?? 0))}/
        {formatLargeNumber(Number(totals.linesAdded ?? 0))}/
        {formatLargeNumber(Number(totals.linesEdited ?? 0))}
      </TableCell>
      <TableCell>{lastCell}</TableCell>
    </>
  );
}
