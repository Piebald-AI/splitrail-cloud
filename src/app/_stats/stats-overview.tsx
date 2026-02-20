import { formatDate, formatLargeNumber } from "@/lib/utils";
import { APPLICATION_LABELS } from "@/lib/application-config";
import { TZDateMini } from "@date-fns/tz";
import {
  CalendarCheck,
  CircleDollarSign,
  Hammer,
  SquareTerminal,
  WholeWord,
} from "lucide-react";
import { StatCard } from "./stat-card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { type DayStat, type GrandTotal } from "./types";

const utc = (date: string) => new TZDateMini(date, "UTC");

export function StatsOverview({
  grandTotal,
  appTotals,
  formatConvertedCurrency,
}: {
  grandTotal: GrandTotal;
  appTotals: Record<string, DayStat>;
  formatConvertedCurrency: (amount: number) => string;
}) {
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

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
      <StatCard
        Icon={WholeWord}
        label="Tokens"
        value={formatLargeNumber(grandTotal.tokens)}
        info={`${formatLargeNumber(grandTotal.tokens / grandTotal.daysTracked)}/day avg`}
        accent="violet"
      />
      <StatCard
        Icon={CircleDollarSign}
        label="Cost"
        value={formatConvertedCurrency(grandTotal.cost)}
        info={`${formatConvertedCurrency(grandTotal.cost / grandTotal.daysTracked)}/day avg`}
        accent="amber"
      />
      <StatCard
        Icon={Hammer}
        label="Tool Calls"
        value={formatLargeNumber(grandTotal.toolCalls)}
        info={`${formatLargeNumber(grandTotal.toolCalls / grandTotal.daysTracked)}/day avg`}
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
  );
}
