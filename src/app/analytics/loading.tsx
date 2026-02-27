import { AnalyticsSkeleton } from "@/components/ui/page-loading";

export default function AnalyticsLoading() {
  return (
    <div className="animate-in fade-in-0 duration-300">
      <AnalyticsSkeleton />
    </div>
  );
}
