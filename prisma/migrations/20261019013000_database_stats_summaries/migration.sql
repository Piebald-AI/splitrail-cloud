-- Additive migration: deploy before the new application. Remove the legacy
-- user_stats table only after all old application instances have stopped.
-- Bring fresh installs up to source columns previously added outside migrations.
-- Existing production columns and values are preserved.
ALTER TABLE message_stats
  ADD COLUMN IF NOT EXISTS "reasoningTokens" bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS uuid text,
  ADD COLUMN IF NOT EXISTS "sessionName" text;
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS timezone text;
CREATE INDEX IF NOT EXISTS "message_stats_userId_application_conversationHash_date_idx"
  ON message_stats ("userId", application, "conversationHash", date);

CREATE TABLE stats_refresh_state (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  source_version bigint NOT NULL DEFAULT 0,
  refreshed_version bigint NOT NULL DEFAULT -1,
  refreshed_at timestamptz
);
INSERT INTO stats_refresh_state (id) VALUES (true);

CREATE FUNCTION mark_stats_dirty() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE stats_refresh_state SET source_version = source_version + 1 WHERE id;
  RETURN NULL;
END;
$$;
CREATE TRIGGER message_stats_changed
AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE ON message_stats
FOR EACH STATEMENT EXECUTE FUNCTION mark_stats_dirty();
CREATE TRIGGER stats_preferences_changed
AFTER INSERT OR UPDATE OR DELETE ON user_preferences
FOR EACH STATEMENT EXECUTE FUNCTION mark_stats_dirty();

-- Daily buckets use the user's saved timezone; other buckets use UTC.
-- The first message of each conversation contributes exactly one conversation,
-- even if its messages span multiple dates or models.
CREATE MATERIALIZED VIEW stats_summary AS
WITH messages AS (
  SELECT m.*, COALESCE(tz.name, 'UTC') AS timezone,
    row_number() OVER (
      PARTITION BY m."userId", m.application, m."conversationHash"
      ORDER BY m.date, m."globalHash"
    ) AS conversation_message_number
  FROM message_stats m
  LEFT JOIN user_preferences p ON p."userId" = m."userId"
  LEFT JOIN pg_timezone_names tz ON tz.name = p.timezone
)
SELECT m."userId", m.application, b.period, b."periodStart",
  CASE WHEN b.period = 'daily' THEN m.timezone ELSE 'UTC' END AS timezone,
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
  COUNT(*) FILTER (WHERE m.role = 'user')::bigint AS "userMessages",
  COUNT(*) FILTER (
    WHERE m.conversation_message_number = 1
  )::bigint AS conversations,
  COALESCE(array_agg(DISTINCT m.model ORDER BY m.model)
    FILTER (WHERE m.model IS NOT NULL), ARRAY[]::text[]) AS models
FROM messages m
CROSS JOIN LATERAL (VALUES
  ('daily', date_trunc('day', m.date AT TIME ZONE 'UTC' AT TIME ZONE m.timezone)),
  ('weekly', date_trunc('week', m.date)),
  ('monthly', date_trunc('month', m.date)),
  ('all', timestamp '1970-01-01')
) b(period, "periodStart")
GROUP BY m."userId", m.application, b.period, b."periodStart",
  CASE WHEN b.period = 'daily' THEN m.timezone ELSE 'UTC' END
WITH NO DATA;

CREATE UNIQUE INDEX stats_summary_bucket_key
ON stats_summary ("userId", application, period, "periodStart");
CREATE INDEX stats_summary_period_idx ON stats_summary (period, application);

CREATE FUNCTION refresh_stats_summary() RETURNS boolean LANGUAGE plpgsql AS $$
DECLARE
  captured_version bigint;
  snapshot_time timestamptz;
  state stats_refresh_state%ROWTYPE;
BEGIN
  -- Transaction-scoped lock skips overlapping cron invocations.
  IF NOT pg_try_advisory_xact_lock(782634091) THEN RETURN false; END IF;
  SELECT * INTO state FROM stats_refresh_state WHERE id;
  IF state.source_version = state.refreshed_version THEN RETURN false; END IF;
  captured_version := state.source_version;
  snapshot_time := clock_timestamp();
  REFRESH MATERIALIZED VIEW CONCURRENTLY stats_summary;
  -- Changes committed while refreshing remain dirty for the next run.
  UPDATE stats_refresh_state
    SET refreshed_version = captured_version, refreshed_at = snapshot_time
    WHERE id;
  RETURN true;
END;
$$;

-- Initial population is part of the migration, before readers switch over.
DO $$
DECLARE
  captured_version bigint;
  snapshot_time timestamptz := clock_timestamp();
BEGIN
  SELECT source_version INTO captured_version FROM stats_refresh_state WHERE id;
  REFRESH MATERIALIZED VIEW stats_summary;
  UPDATE stats_refresh_state
    SET refreshed_version = captured_version, refreshed_at = snapshot_time WHERE id;
END;
$$;
