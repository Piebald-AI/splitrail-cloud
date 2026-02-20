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
import { type GrandTotal } from "./types";

const utc = (date: string) => new TZDateMini(date, "UTC");

export function StatsOverview({
  grandTotal,
  formatConvertedCurrency,
}: {
  grandTotal: GrandTotal;
  formatConvertedCurrency: (amount: number) => string;
}) {
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
          grandTotal.applications
            .map((app) => APPLICATION_LABELS[app as keyof typeof APPLICATION_LABELS])
            .join(", ") || ""
        }
        accent="teal"
      />
    </div>
  );
}
