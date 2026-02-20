import { cn } from "@/lib/utils";
import { type LucideIcon } from "lucide-react";

type StatCardAccent = "violet" | "amber" | "emerald" | "sky" | "teal";

const ACCENT_BORDER: Record<StatCardAccent, string> = {
  violet: "border-l-violet-500",
  amber: "border-l-amber-500",
  emerald: "border-l-emerald-600",
  sky: "border-l-sky-500",
  teal: "border-l-teal-500",
};

const ACCENT_TEXT: Record<StatCardAccent, string> = {
  violet: "text-violet-600 dark:text-violet-400",
  amber: "text-amber-600 dark:text-amber-400",
  emerald: "text-emerald-700 dark:text-emerald-400",
  sky: "text-sky-600 dark:text-sky-400",
  teal: "text-teal-600 dark:text-teal-400",
};

export function StatCard({
  Icon,
  label,
  value,
  info,
  accent,
}: {
  Icon: LucideIcon;
  label: string;
  value: string;
  info?: string;
  accent?: StatCardAccent;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card px-5 py-4 border-l-4",
        accent ? ACCENT_BORDER[accent] : "border-l-border"
      )}
    >
      <div className="flex items-center gap-1.5 text-muted-foreground mb-3">
        <Icon className="size-3.5 shrink-0" />
        <span className="text-xs uppercase tracking-widest font-semibold">
          {label}
        </span>
      </div>
      <p
        className={cn(
          "text-2xl font-mono font-bold tracking-tight leading-none",
          accent ? ACCENT_TEXT[accent] : ""
        )}
      >
        {value}
      </p>
      {info && (
        <p className="text-xs text-muted-foreground mt-2 font-mono">{info}</p>
      )}
    </div>
  );
}
