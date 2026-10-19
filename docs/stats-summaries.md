# Database-managed stats summaries

`message_stats` is the source of truth. PostgreSQL derives `stats_summary`, a materialized view containing daily, weekly, monthly, and all-time totals per user and application. There are no application-maintained aggregate rows. Daily buckets use each user's saved timezone (UTC fallback); weekly and monthly buckets use UTC. Conversation counts belong to the bucket containing the first message for each user/application/conversation. For compatibility with existing summaries, empty conversation hashes count as one conversation per user/application. Models are distinct per bucket.

The dashboard, analytics, and leaderboard read the same snapshot. Profile visibility is checked against live preferences, outside the summary, so making a profile private takes effect immediately. Model-level charts and explicit exports still use raw messages and can reflect newer data than the summary.

## Refreshing

Vercel invokes `/api/cron/refresh-stats` every 15 minutes. Set a strong `CRON_SECRET` in the deployment environment; Vercel sends it in the Authorization header. A missing secret fails closed. The Vercel plan must support a 15-minute cron schedule and the configured 300-second function duration. If hosting elsewhere, issue an authenticated GET on the same schedule.

The route only calls `SELECT refresh_stats_summary()`. Database statement triggers mark the source dirty on message changes and preference changes. Unchanged data skips the full aggregation. A transaction-scoped advisory lock skips overlapping refreshes. A concurrent materialized-view refresh keeps the previous snapshot readable; the snapshot and freshness metadata commit together. Changes during refresh remain dirty for the next scheduled run. Failures retain the previous snapshot and metadata, and the next cron retries.

Visible pages re-fetch summaries every 15 minutes, every minute while a refresh is pending, and when the window regains focus. This only reads the view; it never triggers aggregation. Hidden tabs do not poll in the background.

The timestamp is the start of the successful refresh, a conservative snapshot age. The notice flags pending snapshots older than 30 minutes as delayed. Without source changes, a long-lived snapshot is still current. Cron requests still connect to Neon and may wake a suspended compute even if the subsequent dirty check skips aggregation.

Uploads save source data immediately and return a notice that summaries usually catch up within 15 minutes. Deletions of message data are immediate, but summary totals can remain visible until refresh. Account deletion removes the live user and leaderboard join immediately. No public user can request a global refresh through the old recalculation endpoint.

## Deployment order

1. Configure `CRON_SECRET` and confirm cron frequency/function-duration support.
2. Apply `pnpm db:migrate` using the intended database connection. The additive migration creates and initially populates the view. Measure initial population time on a representative copy first: it scans all source rows and sorts conversations. Readers of the old application can continue using `user_stats` during this step. Do not run `prisma db push` against production: it does not install the SQL view/functions/triggers and can remove database-owned objects.
3. Deploy the new application and cron configuration. Verify stats, privacy, upload notices, and a successful scheduled refresh. Compare all-time summary totals with raw totals, allowing floating-point tolerance for cost.
4. After old instances and rollback versions are retired, execute `scripts/drop-legacy-user-stats.sql` against that database. This is deliberately separate from the additive migration, because dropping `user_stats` while old code is running breaks uploads and personal analytics. The new code does not read or write the legacy table.

PostgreSQL materialized views perform a full recomputation, not incremental maintenance. Measure refresh duration and temporary-file usage at production scale. If it exceeds the hosting timeout, move the refresh invocation to a worker with a longer timeout; never force a refresh from a page request.

## Local verification

Use a disposable PostgreSQL 17 database. The SQL checks mutate fixture rows and require a localhost connection. Do not use production credentials.

```powershell
docker run --detach --name splitrail-stats-test -e POSTGRES_PASSWORD=splitrail-test-only -p 127.0.0.1:55439:5432 postgres:17
$env:DATABASE_URL = 'postgresql://postgres:splitrail-test-only@127.0.0.1:55439/postgres'
pnpm db:generate
pnpm db:migrate
$env:STATS_TEST_DATABASE_URL = $env:DATABASE_URL
pnpm exec tsx scripts/check-stats-summary.ts
pnpm exec tsx scripts/check-delete-date-bounds.ts
pnpm type-check
```

The migration also adds previously untracked source columns with `IF NOT EXISTS`, preserving existing production values while allowing all migrations to replay on an empty database. The checks have been run both against the current source schema and against a complete migration replay.
