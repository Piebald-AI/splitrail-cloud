"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import type { DeletionType } from "./deletion-type-step";

interface DateSelectionStepProps {
  deletionType: DeletionType;
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}

export function DateSelectionStep({
  deletionType,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateSelectionStepProps) {
  const formatDateRange = () => {
    if (!startDate) return "";

    try {
      if (deletionType === "single") {
        return format(new Date(startDate), "MMMM d, yyyy");
      } else {
        if (!endDate) return format(new Date(startDate), "MMMM d, yyyy");
        return `${format(new Date(startDate), "MMMM d, yyyy")} - ${format(new Date(endDate), "MMMM d, yyyy")}`;
      }
    } catch {
      return "";
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Select Date{deletionType === "range" ? " Range" : ""}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {deletionType === "single"
            ? "Choose the specific day to delete data from."
            : "Choose the start and end dates for the range to delete."}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">
            {deletionType === "single" ? "Date" : "Start Date"}
          </Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
          />
        </div>

        {deletionType === "range" && (
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              min={startDate}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>
        )}

        {startDate && (
          <div className="text-sm text-muted-foreground">
            Selected: {formatDateRange()}
          </div>
        )}
      </div>
    </div>
  );
}
