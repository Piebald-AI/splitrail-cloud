import { DashboardSkeleton } from "@/components/ui/page-loading";

export default function DashboardLoading() {
  return (
    <div className="animate-in fade-in-0 duration-300">
      <DashboardSkeleton />
    </div>
  );
}
