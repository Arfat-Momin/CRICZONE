-- ============================================================
-- CRICZONE — PHASE14_DIAGNOSTIC.sql
-- Verifies realtime is fully configured. Run this and paste output.
-- ============================================================

-- 1) Replica identity (should return `f` for all three)
select relname as table_name, relreplident
from pg_class
where relname in ('players','teams','auction_state','bid_events')
order by relname;

-- 2) Publication members (should list all four tables)
select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
order by tablename;