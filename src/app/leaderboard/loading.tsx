import { LeaderboardSkeleton } from "@/components/ui/page-loading";

export default function LeaderboardLoading() {
  return (
    <div className="animate-in fade-in-0 duration-300">
      <LeaderboardSkeleton />
    </div>
  );
}
