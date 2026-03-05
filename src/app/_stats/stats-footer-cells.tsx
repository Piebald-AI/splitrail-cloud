"use client";

import * as React from "react";
import { formatLargeNumber } from "@/lib/utils";
import { TableCell } from "@/components/ui/table";
import {
  addCounterValues,
  type CounterInput,
} from "@/app/_stats/types";

type TotalsMetrics = {
  cachedTokens?: CounterInput;
  inputTokens?: CounterInput;
  outputTokens?: CounterInput;
  reasoningTokens?: CounterInput;
  conversations?: CounterInput;
  toolCalls?: CounterInput;
  terminalCommands?: CounterInput;
  fileSearches?: CounterInput;
  fileContentSearches?: CounterInput;
  filesRead?: CounterInput;
  filesAdded?: CounterInput;
  filesEdited?: CounterInput;
  filesDeleted?: CounterInput;
  linesRead?: CounterInput;
  linesAdded?: CounterInput;
  linesEdited?: CounterInput;
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
      <TableCell>{formatLargeNumber(totals.cachedTokens ?? 0n)}</TableCell>
      <TableCell>{formatLargeNumber(totals.inputTokens ?? 0n)}</TableCell>
      <TableCell>{formatLargeNumber(totals.outputTokens ?? 0n)}</TableCell>
      <TableCell>{formatLargeNumber(totals.reasoningTokens ?? 0n)}</TableCell>
      <TableCell>{formatLargeNumber(totals.conversations ?? 0n)}</TableCell>
      <TableCell className="text-green-600">
        {formatLargeNumber(totals.toolCalls ?? 0n)}
      </TableCell>
      <TableCell>
        {formatLargeNumber(totals.terminalCommands ?? 0n)}
      </TableCell>
      <TableCell>
        {formatLargeNumber(
          addCounterValues(totals.fileSearches, totals.fileContentSearches)
        )}
      </TableCell>
      <TableCell>
        {formatLargeNumber(totals.filesRead ?? 0n)}/
        {formatLargeNumber(totals.filesAdded ?? 0n)}/
        {formatLargeNumber(totals.filesEdited ?? 0n)}/
        {formatLargeNumber(totals.filesDeleted ?? 0n)}
      </TableCell>
      <TableCell>
        {formatLargeNumber(totals.linesRead ?? 0n)}/
        {formatLargeNumber(totals.linesAdded ?? 0n)}/
        {formatLargeNumber(totals.linesEdited ?? 0n)}
      </TableCell>
      <TableCell>{lastCell}</TableCell>
    </>
  );
}
