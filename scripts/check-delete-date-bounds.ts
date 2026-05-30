import { getDeleteDateBounds } from "../src/app/api/user/[userId]/stats/route";

function assertEqual(actual: string, expected: string, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

const winter = getDeleteDateBounds(
  "2026-01-15",
  "2026-01-15",
  "America/Boise"
);
assertEqual(
  winter.startDateTime.toISOString(),
  "2026-01-15T07:00:00.000Z",
  "winter start"
);
assertEqual(
  winter.endDateTime.toISOString(),
  "2026-01-16T06:59:59.999Z",
  "winter end"
);

const summer = getDeleteDateBounds(
  "2026-05-30",
  "2026-05-30",
  "America/Boise"
);
assertEqual(
  summer.startDateTime.toISOString(),
  "2026-05-30T06:00:00.000Z",
  "summer start"
);
assertEqual(
  summer.endDateTime.toISOString(),
  "2026-05-31T05:59:59.999Z",
  "summer end"
);

const utcFallback = getDeleteDateBounds("2026-01-15", "2026-01-15", null);
assertEqual(
  utcFallback.startDateTime.toISOString(),
  "2026-01-15T00:00:00.000Z",
  "UTC fallback start"
);
assertEqual(
  utcFallback.endDateTime.toISOString(),
  "2026-01-15T23:59:59.999Z",
  "UTC fallback end"
);

console.log("delete date bounds checks passed");
