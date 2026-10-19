-- Run only AFTER deploying the materialized-view readers and retiring all old
-- application instances/rollback versions. See docs/stats-summaries.md.
-- The authoritative message_stats table and stats_summary are retained.
DROP TABLE IF EXISTS user_stats;
