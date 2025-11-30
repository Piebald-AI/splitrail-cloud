"use client";

import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { AlertCircle } from "lucide-react";
import type { ApplicationType } from "@/types";
import type { DeletionType } from "./deletion-type-step";
import { APPLICATION_LABELS } from "@/lib/application-config";

interface ReviewStepProps {
  userId: string;
  deletionType: DeletionType;
  startDate: string;
  endDate: string;
  selectedApplications: ApplicationType[];
}

export function ReviewStep({
  userId,
  deletionType,
  startDate,
  endDate,
  selectedApplications,
}: ReviewStepProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["deletePreview", userId, startDate, endDate, selectedApplications],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate,
        endDate: deletionType === "single" ? startDate : endDate,
        applications: selectedApplications.join(","),
      });

      const response = await fetch(
        `/api/user/${userId}/stats/preview?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch preview");
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch preview");
      }

      return result.data as {
        messageCount: number;
        affectedDays: number;
        dateRange: { start: string; end: string };
        applications: string[];
      };
    },
    enabled: !!userId && !!startDate && selectedApplications.length > 0,
  });

  const formatDateRange = () => {
    try {
      if (deletionType === "single") {
        return format(new Date(startDate), "MMMM d, yyyy");
      } else {
        return `${format(new Date(startDate), "MMMM d, yyyy")} - ${format(new Date(endDate), "MMMM d, yyyy")}`;
      }
    } catch {
      return `${startDate} - ${endDate}`;
    }
  };

  const formatApplications = () => {
    return selectedApplications
      .map((app) => APPLICATION_LABELS[app])
      .join(", ");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground mt-4">
          Calculating deletion preview...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error instanceof Error ? error.message : "Failed to load preview"}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Review & Confirm</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Review what will be deleted before proceeding.
        </p>
      </div>

      <div className="p-4 border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950 rounded-lg space-y-3">
        <div className="flex items-start gap-2">
          <span className="text-xl">📅</span>
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Dates
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              {formatDateRange()}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <span className="text-xl">🤖</span>
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Applications
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              {formatApplications()}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <span className="text-xl">📊</span>
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Impact
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              ~{data?.messageCount || 0} messages across {data?.affectedDays || 0} day
              {data?.affectedDays !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {data?.messageCount === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No data found for the selected dates and applications.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
