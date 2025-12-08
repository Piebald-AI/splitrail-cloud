"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DeletionTypeStep,
  type DeletionType,
} from "./delete-data-by-date/deletion-type-step";
import { DateSelectionStep } from "./delete-data-by-date/date-selection-step";
import { ApplicationFilterStep } from "./delete-data-by-date/application-filter-step";
import { ReviewStep } from "./delete-data-by-date/review-step";
import type { ApplicationType } from "@/types";
import { APPLICATION_LABELS } from "@/lib/application-config";
import { format } from "date-fns";

export function DeleteDataByDate() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(1);
  const [deletionType, setDeletionType] = useState<DeletionType>("single");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedApplications, setSelectedApplications] = useState<
    ApplicationType[]
  >([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!session?.user?.id) throw new Error("No user session");

      const params = new URLSearchParams({
        startDate,
        endDate: deletionType === "single" ? startDate : endDate,
        applications: selectedApplications.join(","),
      });

      const response = await fetch(
        `/api/user/${session.user.id}/stats?${params.toString()}`,
        { method: "DELETE" }
      );

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to delete data");
      }
      return data.data;
    },
    onSuccess: () => {
      const dateStr =
        deletionType === "single"
          ? format(new Date(startDate), "MMMM d, yyyy")
          : `${format(new Date(startDate), "MMMM d, yyyy")} - ${format(new Date(endDate), "MMMM d, yyyy")}`;

      const appNames = selectedApplications
        .map((app) => APPLICATION_LABELS[app])
        .join(", ");

      toast.success(
        `Successfully deleted data from ${dateStr} for ${appNames}`
      );

      // Reset wizard
      setCurrentStep(1);
      setDeletionType("single");
      setStartDate("");
      setEndDate("");
      setSelectedApplications([]);
      setConfirmDialogOpen(false);

      // Refresh queries
      queryClient.invalidateQueries({ queryKey: ["userStats"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete data"
      );
      setConfirmDialogOpen(false);
    },
  });

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return true;
      case 2:
        if (deletionType === "single") return !!startDate;
        return !!startDate && !!endDate && endDate >= startDate;
      case 3:
        return selectedApplications.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canGoNext()) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleCancel = () => {
    setCurrentStep(1);
    setDeletionType("single");
    setStartDate("");
    setEndDate("");
    setSelectedApplications([]);
  };

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

  if (!session?.user?.id) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Step {currentStep} of 4
        </div>
      </div>

      <div className="min-h-[300px]">
        {currentStep === 1 && (
          <DeletionTypeStep value={deletionType} onChange={setDeletionType} />
        )}
        {currentStep === 2 && (
          <DateSelectionStep
            deletionType={deletionType}
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
        )}
        {currentStep === 3 && (
          <ApplicationFilterStep
            selectedApplications={selectedApplications}
            onApplicationsChange={setSelectedApplications}
          />
        )}
        {currentStep === 4 && (
          <ReviewStep
            userId={session.user.id}
            deletionType={deletionType}
            startDate={startDate}
            endDate={endDate}
            selectedApplications={selectedApplications}
          />
        )}
      </div>

      <div className="flex justify-between pt-4 border-t">
        <div>
          {currentStep > 1 && (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          {currentStep < 4 ? (
            <Button onClick={handleNext} disabled={!canGoNext()}>
              Next
            </Button>
          ) : (
            <Button
              variant="warning"
              onClick={() => setConfirmDialogOpen(true)}
              disabled={!canGoNext() || deleteMutation.isPending}
            >
              Delete Data
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Data?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>You&apos;re about to permanently delete data from:</p>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2">
                    <span>📅</span>
                    <div>
                      <span className="font-medium">Dates:</span>{" "}
                      {formatDateRange()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span>🤖</span>
                    <div>
                      <span className="font-medium">Applications:</span>{" "}
                      {formatApplications()}
                    </div>
                  </div>
                </div>
                <p className="font-semibold">This action cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Yes, Delete Data"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
