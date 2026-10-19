import assert from "node:assert/strict";
import { PrismaClient, type Prisma } from "@prisma/client";

// Run only against the disposable PostgreSQL database described in docs/stats-summaries.md.
const url = process.env.STATS_TEST_DATABASE_URL;
if (!url || !["localhost", "127.0.0.1"].includes(new URL(url).hostname)) {
  throw new Error(
    "STATS_TEST_DATABASE_URL must point to a disposable local database"
  );
}
const db = new PrismaClient({ datasources: { db: { url } } });
const userId = "summary-test-user";
const counters = {
  inputTokens: 0n,
  outputTokens: 0n,
  cacheCreationTokens: 0n,
  cacheReadTokens: 0n,
  cachedTokens: 0n,
  reasoningTokens: 0n,
  toolCalls: 0n,
  terminalCommands: 0n,
  fileSearches: 0n,
  fileContentSearches: 0n,
  filesRead: 0n,
  filesAdded: 0n,
  filesEdited: 0n,
  filesDeleted: 0n,
  linesRead: 0n,
  linesEdited: 0n,
  linesAdded: 0n,
  linesDeleted: 0n,
  bytesRead: 0n,
  bytesAdded: 0n,
  bytesEdited: 0n,
  bytesDeleted: 0n,
  codeLines: 0n,
  docsLines: 0n,
  dataLines: 0n,
  mediaLines: 0n,
  configLines: 0n,
  otherLines: 0n,
  todosCreated: 0n,
  todosCompleted: 0n,
  todosInProgress: 0n,
  todoReads: 0n,
  todoWrites: 0n,
};
function message(
  hash: string,
  date: string,
  conversationHash: string,
  application = "claude_code"
): Prisma.MessageStatsCreateManyInput {
  return {
    ...counters,
    globalHash: hash,
    userId,
    application,
    role: "assistant",
    date: new Date(date),
    conversationHash,
    projectHash: "project",
    model: "test-model",
    cost: 2,
    inputTokens: 100n,
    linesAdded: 5n,
  };
}
async function refresh() {
  const [result] = await db.$queryRaw<
    { refreshed: boolean }[]
  >`SELECT refresh_stats_summary() AS refreshed`;
  return result.refreshed;
}
type Bucket = {
  period: string;
  day: string;
  application: string;
  cost: number;
  conversations: bigint;
  models: string[];
};
async function buckets() {
  return db.$queryRaw<
    Bucket[]
  >`SELECT period, "periodStart"::date::text AS day, application, cost, conversations, models
    FROM stats_summary WHERE "userId" = ${userId} ORDER BY period, day, application`;
}
async function pending() {
  const [state] = await db.$queryRaw<
    { pending: boolean }[]
  >`SELECT source_version <> refreshed_version AS pending FROM stats_refresh_state WHERE id`;
  return state.pending;
}
async function main() {
  try {
    await db.user.deleteMany({ where: { id: userId } });
    await db.user.create({
      data: {
        id: userId,
        githubId: userId,
        username: userId,
        preferences: {
          create: { timezone: "America/New_York", publicProfile: true },
        },
      },
    });
    await db.messageStats.createMany({
      data: [
        // Both sides of the local midnight and spring DST transition.
        message("summary-test-1", "2026-03-08T04:30:00Z", "conversation"),
        message("summary-test-2", "2026-03-08T07:30:00Z", "conversation"),
        message("summary-test-3", "2026-03-09T03:30:00Z", "other"),
        message("summary-test-4", "2026-03-09T04:30:00Z", "", "codex_cli"),
      ],
    });
    assert.equal(await pending(), true);
    assert.equal(await refresh(), true);
    assert.equal(await pending(), false);
    assert.equal(await refresh(), false, "unchanged source skips refresh");
    let rows = await buckets();
    const daily = rows.filter((r) => r.period === "daily");
    assert.deepEqual(
      daily.map((r) => [r.day, r.application, r.cost, r.conversations]),
      [
        ["2026-03-07", "claude_code", 2, 1n],
        ["2026-03-08", "claude_code", 4, 1n],
        ["2026-03-09", "codex_cli", 2, 1n],
      ]
    );
    assert.equal(
      rows
        .filter((r) => r.period === "all")
        .reduce((sum, r) => sum + r.cost, 0),
      8
    );
    assert.ok(rows.every((r) => r.models.join() === "test-model"));
    assert.equal(
      rows.find((r) => r.period === "weekly" && r.day === "2026-03-02")
        ?.conversations,
      1n
    );

    // Deleting the first message moves the conversation count to its next day.
    await db.messageStats.delete({ where: { globalHash: "summary-test-1" } });
    assert.equal(await pending(), true);
    assert.equal(
      (await buckets()).find(
        (r) => r.period === "all" && r.application === "claude_code"
      )?.cost,
      6,
      "old snapshot remains readable until refresh"
    );
    await refresh();
    rows = await buckets();
    assert.equal(
      rows.find((r) => r.period === "daily" && r.day === "2026-03-08")
        ?.conversations,
      2n
    );
    assert.equal(
      rows.some((r) => r.period === "daily" && r.day === "2026-03-07"),
      false
    );

    // Corrections and timezone changes derive new results without app aggregation.
    await db.messageStats.update({
      where: { globalHash: "summary-test-2" },
      data: { cost: 7 },
    });
    await db.userPreferences.update({
      where: { userId },
      data: { timezone: "Asia/Kolkata" },
    });
    await refresh();
    rows = await buckets();
    assert.equal(
      rows.find((r) => r.period === "all" && r.application === "claude_code")
        ?.cost,
      9
    );
    assert.equal(
      rows.filter((r) => r.period === "daily" && r.day === "2026-03-09").length,
      2
    );

    // PostgreSQL advisory lock prevents overlapping refresh workers.
    await db.messageStats.update({
      where: { globalHash: "summary-test-2" },
      data: { cost: 8 },
    });
    await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(782634091)::text`;
      assert.equal(await refresh(), false);
      assert.equal(await pending(), true);
    });
    await refresh();

    // A failed refresh must leave the old snapshot and dirty state intact.
    await db.messageStats.update({
      where: { globalHash: "summary-test-2" },
      data: { cost: 9 },
    });
    await assert.rejects(
      db.$transaction(async (tx) => {
        await tx.$executeRawUnsafe("SET LOCAL statement_timeout = '1ms'");
        await tx.$queryRaw`SELECT refresh_stats_summary()`;
        throw new Error(
          "Roll back even if this tiny fixture finishes in under 1ms"
        );
      })
    );
    assert.equal(await pending(), true);
    assert.equal(
      (await buckets()).find(
        (r) => r.period === "all" && r.application === "claude_code"
      )?.cost,
      10
    );
    await refresh();
    assert.equal(await pending(), false);

    // Public visibility is live, even while the summary retains a prior snapshot.
    await db.userPreferences.update({
      where: { userId },
      data: { publicProfile: false },
    });
    const publicRows = await db.$queryRaw<{ count: bigint }[]>`
    SELECT count(*) FROM stats_summary s JOIN user_preferences p ON p."userId"=s."userId"
    WHERE s."userId"=${userId} AND p."publicProfile"
  `;
    assert.equal(publicRows[0].count, 0n);
    await refresh();

    // Exercise the scheduled route's authentication without starting a server.
    process.env.DATABASE_URL = url;
    const { NextRequest } = await import("next/server");
    const { GET } = await import("../src/app/api/cron/refresh-stats/route");
    const { db: routeDb } = await import("../src/lib/db");
    const previousSecret = process.env.CRON_SECRET;
    try {
      delete process.env.CRON_SECRET;
      assert.equal(
        (await GET(new NextRequest("http://localhost/api/cron/refresh-stats")))
          .status,
        503
      );
      process.env.CRON_SECRET = "summary-test-secret";
      assert.equal(
        (
          await GET(
            new NextRequest("http://localhost/api/cron/refresh-stats", {
              headers: { authorization: "Bearer wrong" },
            })
          )
        ).status,
        401
      );
      const authorized = await GET(
        new NextRequest("http://localhost/api/cron/refresh-stats", {
          headers: { authorization: "Bearer summary-test-secret" },
        })
      );
      assert.equal(authorized.status, 200);
      assert.equal((await authorized.json()).refreshed, false);
    } finally {
      if (previousSecret === undefined) delete process.env.CRON_SECRET;
      else process.env.CRON_SECRET = previousSecret;
      await routeDb.$disconnect();
    }
    console.log(
      "Stats summary checks passed: buckets, DST, conversations, corrections, locks, rollback, freshness, privacy, cron authentication."
    );
  } finally {
    await db.user.deleteMany({ where: { id: userId } });
    await refresh();
    await db.$disconnect();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
