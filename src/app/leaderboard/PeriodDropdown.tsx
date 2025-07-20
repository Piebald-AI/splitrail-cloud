"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

type PeriodType =
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "all-time";

interface PeriodDropdownProps {
  period: PeriodType;
  setPeriod: (period: PeriodType) => void;
}

export function PeriodDropdown({ period, setPeriod }: PeriodDropdownProps) {
  const periodOptions = [
    { value: "hourly", label: "This Hour" },
    { value: "daily", label: "Today" },
    { value: "weekly", label: "This Week" },
    { value: "monthly", label: "This Month" },
    { value: "yearly", label: "This Year" },
    { value: "all-time", label: "All Time" },
  ] as const;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          {period === "all-time"
            ? "All Time"
            : period.charAt(0).toUpperCase() + period.slice(1)}{" "}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {periodOptions.map((periodOption) => (
          <DropdownMenuCheckboxItem
            key={periodOption.value}
            checked={period === periodOption.value}
            onCheckedChange={(checked) => {
              if (checked) {
                setPeriod(periodOption.value as PeriodType);
              }
            }}
          >
            {periodOption.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
