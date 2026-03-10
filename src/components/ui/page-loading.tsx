"use client";

import * as React from "react";
import { useDeferredLoading } from "@/hooks/use-deferred-loading";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * A two-phase loading pattern:
 * 1. When `isLoading` is true, shows nothing for the first `delay` ms (avoids flash)
 * 2. After the delay, fades in the skeleton fallback
 * 3. When content is ready, fades it in smoothly
 */
export function PageLoading({
  isLoading,
  skeleton,
  children,
  delay = 300,
  className,
}: {
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const showSkeleton = useDeferredLoading(isLoading, delay);

  if (isLoading) {
    if (!showSkeleton) {
      return null;
    }

    return (
      <div className={cn("animate-in fade-in-0 duration-300", className)}>
        {skeleton}
      </div>
    );
  }

  return (
    <div className={cn("animate-in fade-in-0 duration-300", className)}>
      {children}
    </div>
  );
}

// --- Reusable skeleton building blocks ---

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-y-8">
      {/* Source badges */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>

      {/* Stats overview cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>

      {/* Charts area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>

      {/* Table area */}
      <Skeleton className="h-80 rounded-lg" />
    </div>
  );
}

export function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-y-8">
      {/* Header row: source badges + toggle */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-9 w-56 rounded-md" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-md border bg-card overflow-hidden">
        <div className="p-4 space-y-3">
          {/* Header row */}
          <div className="flex gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
          </div>
          {/* Data rows */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              {Array.from({ length: 6 }).map((_, j) => (
                <Skeleton key={j} className="h-4 flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="container mx-auto">
      {/* Title */}
      <Skeleton className="h-9 w-32 mb-6" />

      {/* CLI Integration Section */}
      <div className="mb-12 border-b border-border pb-12">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>

      {/* Profile & Display Settings */}
      <div className="mb-12 border-b border-border pb-12">
        <Skeleton className="h-6 w-44 mb-4" />
        <div className="flex flex-col space-y-8">
          <div className="flex flex-row items-center gap-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-56 rounded-md" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-10 w-16 mt-6 rounded-md" />
      </div>

      {/* Data Management */}
      <div className="mb-12">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-28 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="flex flex-col gap-y-8">
      {/* Title */}
      <Skeleton className="h-9 w-40" />

      <div className="w-full max-w-full flex flex-col gap-y-4">
        {/* Filter bar */}
        <div className="flex items-center flex-row gap-2">
          <Skeleton className="h-10 flex-1 rounded-md" />
          <Skeleton className="h-10 w-24 rounded-md" />
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>

        {/* Table */}
        <div className="rounded-md border bg-card overflow-hidden">
          <div className="p-2 space-y-2">
            {/* Header */}
            <div className="flex gap-3 py-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-4 flex-1" />
              ))}
            </div>
            {/* Rows */}
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="flex gap-3 py-3">
                {Array.from({ length: 8 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 flex-1" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
