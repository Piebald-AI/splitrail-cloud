-- Build a replacement while the previous snapshot remains available. Only the
-- final rename needs a brief exclusive lock. Run with the same database owner
-- that owns stats_summary; allow enough time for initial population.
BEGIN;

CREATE MATERIALIZED VIEW stats_summary_next AS
WITH user_timezones AS MATERIALIZED (
  SELECT p."userId", COALESCE((
    SELECT name FROM pg_timezone_names WHERE name = p.timezone LIMIT 1
  ), 'UTC') AS timezone
  FROM user_preferences p
),
-- GROUPING SETS aggregates source rows without multiplying them by four first.
-- Grouping by model here lets the small final aggregation collect model names
-- without DISTINCT forcing a sort of millions of wide message rows.
model_totals AS (
  SELECT m."userId", m.application,
    CASE WHEN GROUPING(date_trunc('day', m.date AT TIME ZONE 'UTC' AT TIME ZONE COALESCE(t.timezone, 'UTC'))) = 0 THEN 'daily'
         WHEN GROUPING(date_trunc('week', m.date)) = 0 THEN 'weekly'
         WHEN GROUPING(date_trunc('month', m.date)) = 0 THEN 'monthly'
         ELSE 'all' END AS period,
    COALESCE(
      CASE WHEN GROUPING(date_trunc('day', m.date AT TIME ZONE 'UTC' AT TIME ZONE COALESCE(t.timezone, 'UTC'))) = 0
        THEN date_trunc('day', m.date AT TIME ZONE 'UTC' AT TIME ZONE COALESCE(t.timezone, 'UTC')) END,
      CASE WHEN GROUPING(date_trunc('week', m.date)) = 0 THEN date_trunc('week', m.date) END,
      CASE WHEN GROUPING(date_trunc('month', m.date)) = 0 THEN date_trunc('month', m.date) END,
      timestamp '1970-01-01'
    ) AS "periodStart",
    CASE WHEN GROUPING(date_trunc('day', m.date AT TIME ZONE 'UTC' AT TIME ZONE COALESCE(t.timezone, 'UTC'))) = 0
      THEN COALESCE(t.timezone, 'UTC') ELSE 'UTC' END AS timezone,
    m.model,
    COALESCE(SUM(m.cost), 0)::double precision AS cost,
    SUM(m."inputTokens")::bigint AS "inputTokens",
    SUM(m."outputTokens")::bigint AS "outputTokens",
    SUM(m."cacheCreationTokens")::bigint AS "cacheCreationTokens",
    SUM(m."cacheReadTokens")::bigint AS "cacheReadTokens",
    SUM(m."cachedTokens")::bigint AS "cachedTokens",
    SUM(m."reasoningTokens")::bigint AS "reasoningTokens",
    SUM(m."toolCalls")::bigint AS "toolCalls",
    SUM(m."terminalCommands")::bigint AS "terminalCommands",
    SUM(m."fileSearches")::bigint AS "fileSearches",
    SUM(m."fileContentSearches")::bigint AS "fileContentSearches",
    SUM(m."filesRead")::bigint AS "filesRead",
    SUM(m."filesAdded")::bigint AS "filesAdded",
    SUM(m."filesEdited")::bigint AS "filesEdited",
    SUM(m."filesDeleted")::bigint AS "filesDeleted",
    SUM(m."linesRead")::bigint AS "linesRead",
    SUM(m."linesAdded")::bigint AS "linesAdded",
    SUM(m."linesEdited")::bigint AS "linesEdited",
    SUM(m."linesDeleted")::bigint AS "linesDeleted",
    SUM(m."bytesRead")::bigint AS "bytesRead",
    SUM(m."bytesAdded")::bigint AS "bytesAdded",
    SUM(m."bytesEdited")::bigint AS "bytesEdited",
    SUM(m."bytesDeleted")::bigint AS "bytesDeleted",
    SUM(m."codeLines")::bigint AS "codeLines",
    SUM(m."docsLines")::bigint AS "docsLines",
    SUM(m."dataLines")::bigint AS "dataLines",
    SUM(m."mediaLines")::bigint AS "mediaLines",
    SUM(m."configLines")::bigint AS "configLines",
    SUM(m."otherLines")::bigint AS "otherLines",
    SUM(m."todosCreated")::bigint AS "todosCreated",
    SUM(m."todosCompleted")::bigint AS "todosCompleted",
    SUM(m."todosInProgress")::bigint AS "todosInProgress",
    SUM(m."todoReads")::bigint AS "todoReads",
    SUM(m."todoWrites")::bigint AS "todoWrites",
    COUNT(*) FILTER (WHERE m.role = 'assistant')::bigint AS "assistantMessages",
    COUNT(*) FILTER (WHERE m.role = 'user')::bigint AS "userMessages"
  FROM message_stats m
  LEFT JOIN user_timezones t ON t."userId" = m."userId"
  GROUP BY GROUPING SETS (
    (m."userId", m.application, t.timezone, m.model, date_trunc('day', m.date AT TIME ZONE 'UTC' AT TIME ZONE COALESCE(t.timezone, 'UTC'))),
    (m."userId", m.application, t.timezone, m.model, date_trunc('week', m.date)),
    (m."userId", m.application, t.timezone, m.model, date_trunc('month', m.date)),
    (m."userId", m.application, t.timezone, m.model)
  )
),
metric_totals AS (
  SELECT "userId", application, period, "periodStart", timezone,
    SUM(cost)::double precision AS cost,
    SUM("inputTokens")::bigint AS "inputTokens",
    SUM("outputTokens")::bigint AS "outputTokens",
    SUM("cacheCreationTokens")::bigint AS "cacheCreationTokens",
    SUM("cacheReadTokens")::bigint AS "cacheReadTokens",
    SUM("cachedTokens")::bigint AS "cachedTokens",
    SUM("reasoningTokens")::bigint AS "reasoningTokens",
    SUM("toolCalls")::bigint AS "toolCalls",
    SUM("terminalCommands")::bigint AS "terminalCommands",
    SUM("fileSearches")::bigint AS "fileSearches",
    SUM("fileContentSearches")::bigint AS "fileContentSearches",
    SUM("filesRead")::bigint AS "filesRead",
    SUM("filesAdded")::bigint AS "filesAdded",
    SUM("filesEdited")::bigint AS "filesEdited",
    SUM("filesDeleted")::bigint AS "filesDeleted",
    SUM("linesRead")::bigint AS "linesRead",
    SUM("linesAdded")::bigint AS "linesAdded",
    SUM("linesEdited")::bigint AS "linesEdited",
    SUM("linesDeleted")::bigint AS "linesDeleted",
    SUM("bytesRead")::bigint AS "bytesRead",
    SUM("bytesAdded")::bigint AS "bytesAdded",
    SUM("bytesEdited")::bigint AS "bytesEdited",
    SUM("bytesDeleted")::bigint AS "bytesDeleted",
    SUM("codeLines")::bigint AS "codeLines",
    SUM("docsLines")::bigint AS "docsLines",
    SUM("dataLines")::bigint AS "dataLines",
    SUM("mediaLines")::bigint AS "mediaLines",
    SUM("configLines")::bigint AS "configLines",
    SUM("otherLines")::bigint AS "otherLines",
    SUM("todosCreated")::bigint AS "todosCreated",
    SUM("todosCompleted")::bigint AS "todosCompleted",
    SUM("todosInProgress")::bigint AS "todosInProgress",
    SUM("todoReads")::bigint AS "todoReads",
    SUM("todoWrites")::bigint AS "todoWrites",
    SUM("assistantMessages")::bigint AS "assistantMessages",
    SUM("userMessages")::bigint AS "userMessages",
    COALESCE(array_agg(model ORDER BY model) FILTER (WHERE model IS NOT NULL), ARRAY[]::text[]) AS models
  FROM model_totals
  GROUP BY "userId", application, period, "periodStart", timezone
),
-- This independent pass reads only conversation keys and dates, not the wide
-- metric payload. Each conversation contributes one start, including empty keys.
conversation_starts AS (
  SELECT "userId", application, MIN(date) AS first_date
  FROM message_stats
  GROUP BY "userId", application, "conversationHash"
),
conversation_counts AS (
  SELECT c."userId", c.application, b.period, b."periodStart", COUNT(*)::bigint AS conversations
  FROM conversation_starts c
  LEFT JOIN user_timezones t ON t."userId" = c."userId"
  CROSS JOIN LATERAL (VALUES
    ('daily', date_trunc('day', c.first_date AT TIME ZONE 'UTC' AT TIME ZONE COALESCE(t.timezone, 'UTC'))),
    ('weekly', date_trunc('week', c.first_date)),
    ('monthly', date_trunc('month', c.first_date)),
    ('all', timestamp '1970-01-01')
  ) b(period, "periodStart")
  GROUP BY c."userId", c.application, b.period, b."periodStart"
)
SELECT m."userId", m.application, m.period, m."periodStart", m.timezone,
  m.cost, m."inputTokens", m."outputTokens", m."cacheCreationTokens", m."cacheReadTokens",
  m."cachedTokens", m."reasoningTokens", m."toolCalls", m."terminalCommands",
  m."fileSearches", m."fileContentSearches", m."filesRead", m."filesAdded", m."filesEdited",
  m."filesDeleted", m."linesRead", m."linesAdded", m."linesEdited", m."linesDeleted",
  m."bytesRead", m."bytesAdded", m."bytesEdited", m."bytesDeleted", m."codeLines",
  m."docsLines", m."dataLines", m."mediaLines", m."configLines", m."otherLines",
  m."todosCreated", m."todosCompleted", m."todosInProgress", m."todoReads", m."todoWrites",
  m."assistantMessages", m."userMessages", COALESCE(c.conversations, 0)::bigint AS conversations, m.models
FROM metric_totals m
LEFT JOIN conversation_counts c USING ("userId", application, period, "periodStart")
WITH NO DATA;

CREATE UNIQUE INDEX stats_summary_next_bucket_key
  ON stats_summary_next ("userId", application, period, "periodStart");
CREATE INDEX stats_summary_next_period_idx ON stats_summary_next (period, application);

-- Bound per-operation memory for this single, advisory-locked refresh worker.
-- The old 4MB default caused repeated disk spills; this is not a global change.
SET LOCAL work_mem = '64MB';
DO $$
DECLARE
  captured_version bigint;
  snapshot_time timestamptz := clock_timestamp();
BEGIN
  PERFORM pg_advisory_xact_lock(782634091);
  SELECT source_version INTO captured_version FROM stats_refresh_state WHERE id;
  REFRESH MATERIALIZED VIEW stats_summary_next;
  UPDATE stats_refresh_state
    SET refreshed_version = captured_version, refreshed_at = snapshot_time WHERE id;
END;
$$;

-- Preserve access granted to application roles when replacing the relation.
DO $$
DECLARE
  permission record;
  original_owner name;
BEGIN
  SELECT pg_get_userbyid(relowner) INTO original_owner FROM pg_class
    WHERE oid = 'stats_summary'::regclass;
  FOR permission IN
    SELECT a.grantee, a.privilege_type, a.is_grantable
    FROM pg_class c CROSS JOIN LATERAL aclexplode(c.relacl) a
    WHERE c.oid = 'stats_summary'::regclass AND a.grantee <> c.relowner
  LOOP
    EXECUTE format('GRANT %s ON TABLE stats_summary_next TO %s%s',
      permission.privilege_type,
      CASE WHEN permission.grantee = 0 THEN 'PUBLIC' ELSE quote_ident(pg_get_userbyid(permission.grantee)) END,
      CASE WHEN permission.is_grantable THEN ' WITH GRANT OPTION' ELSE '' END);
  END LOOP;
  EXECUTE format('ALTER MATERIALIZED VIEW stats_summary_next OWNER TO %I', original_owner);
END;
$$;

ALTER MATERIALIZED VIEW stats_summary RENAME TO stats_summary_previous;
ALTER MATERIALIZED VIEW stats_summary_next RENAME TO stats_summary;
DROP MATERIALIZED VIEW stats_summary_previous;
ALTER INDEX stats_summary_next_bucket_key RENAME TO stats_summary_bucket_key;
ALTER INDEX stats_summary_next_period_idx RENAME TO stats_summary_period_idx;

CREATE OR REPLACE FUNCTION refresh_stats_summary() RETURNS boolean LANGUAGE plpgsql
SET work_mem = '64MB'
AS $$
DECLARE
  captured_version bigint;
  snapshot_time timestamptz;
  state stats_refresh_state%ROWTYPE;
BEGIN
  IF NOT pg_try_advisory_xact_lock(782634091) THEN RETURN false; END IF;
  SELECT * INTO state FROM stats_refresh_state WHERE id;
  IF state.source_version = state.refreshed_version THEN RETURN false; END IF;
  captured_version := state.source_version;
  snapshot_time := clock_timestamp();
  REFRESH MATERIALIZED VIEW CONCURRENTLY stats_summary;
  UPDATE stats_refresh_state
    SET refreshed_version = captured_version, refreshed_at = snapshot_time WHERE id;
  RETURN true;
END;
$$;
COMMIT;
