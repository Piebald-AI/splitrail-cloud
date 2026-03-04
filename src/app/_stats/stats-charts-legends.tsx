"use client";

import { AREA_SERIES } from "@/app/_stats/stats-charts-config";

export function AreaLegend({
  hidden,
  onToggle,
}: {
  hidden: Set<string>;
  onToggle: (key: string) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-4 pt-2">
      {AREA_SERIES.map((s) => (
        <button
          key={s.key}
          onClick={() => onToggle(s.normKey)}
          className={`flex items-center gap-1.5 text-xs transition-opacity ${hidden.has(s.normKey) ? "opacity-30" : "opacity-100"}`}
        >
          <div
            className="h-2 w-2 shrink-0 rounded-[2px]"
            style={{ backgroundColor: s.color }}
          />
          <span className="text-muted-foreground">{s.label}</span>
        </button>
      ))}
    </div>
  );
}

export function BarLegend({
  models,
  modelColors,
  hidden,
  onToggle,
}: {
  models: string[];
  modelColors: Record<string, string>;
  hidden: Set<string>;
  onToggle: (model: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-2">
      {models.map((model) => (
        <button
          key={model}
          onClick={() => onToggle(model)}
          className={`flex items-center gap-1.5 text-xs transition-opacity ${hidden.has(model) ? "opacity-30" : "opacity-100"}`}
        >
          <div
            className="h-2 w-2 shrink-0 rounded-[2px]"
            style={{ backgroundColor: modelColors[model] }}
          />
          <span className="text-muted-foreground truncate max-w-[200px]">
            {model}
          </span>
        </button>
      ))}
    </div>
  );
}
