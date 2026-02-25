"use client";

import { formatLargeNumber } from "@/lib/utils";
import { AREA_SERIES } from "./stats-charts-config";
import type { AreaChartPoint } from "./stats-charts-config";

export function AreaTooltip({
  active,
  payload,
  label,
  formatConvertedCurrency,
  hidden,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; color: string; payload: AreaChartPoint }>;
  label?: string;
  formatConvertedCurrency: (amount: number) => string;
  hidden: Set<string>;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="border-border/50 bg-background grid min-w-[10rem] gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
      <div className="font-medium">{label}</div>
      {AREA_SERIES.filter((s) => !hidden.has(s.normKey)).map((s) => {
        const item = payload.find((p) => p.dataKey === s.normKey);
        if (!item) return null;
        const formatted =
          s.key === "cost"
            ? formatConvertedCurrency(point[s.key])
            : formatLargeNumber(point[s.key]);
        return (
          <div key={s.key} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <div
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-muted-foreground">{s.label}</span>
            </div>
            <span className="font-mono font-medium tabular-nums">{formatted}</span>
          </div>
        );
      })}
    </div>
  );
}

export function BarTooltip({
  active,
  payload,
  label,
  modelColors,
  formatValue,
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; color: string; value: number }>;
  label?: string;
  modelColors: Record<string, string>;
  formatValue: (v: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value || 0), 0);

  return (
    <div className="border-border/50 bg-background grid min-w-[10rem] gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
      <div className="font-medium">{label}</div>
      {payload
        .filter((p) => p.value > 0)
        .map((p) => (
          <div
            key={p.dataKey}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-1.5">
              <div
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{
                  backgroundColor: modelColors[p.dataKey] || p.color,
                }}
              />
              <span className="text-muted-foreground truncate max-w-[120px]">
                {p.dataKey}
              </span>
            </div>
            <span className="font-mono font-medium tabular-nums">
              {formatValue(p.value)}
            </span>
          </div>
        ))}
      {total > 0 && (
        <div className="flex items-center justify-between gap-4 border-t border-border/40 pt-1 mt-0.5">
          <span className="text-muted-foreground">Total</span>
          <span className="font-mono font-medium tabular-nums">
            {formatValue(total)}
          </span>
        </div>
      )}
    </div>
  );
}
