import { db } from "@/lib/db";
import type { StatsFreshness } from "@/types";

export async function getStatsFreshness(): Promise<StatsFreshness> {
  const [state] = await db.$queryRaw<
    { refreshed_at: Date | null; pending: boolean }[]
  >`SELECT refreshed_at, source_version <> refreshed_version AS pending
    FROM stats_refresh_state WHERE id`;
  return {
    lastRefreshedAt: state?.refreshed_at?.toISOString() ?? null,
    pending: state?.pending ?? true,
    refreshIntervalMinutes: 15,
  };
}
