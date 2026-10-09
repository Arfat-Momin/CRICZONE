-- ============================================================
-- CRICZONE — verify.sql
-- Paste after running PHASE3_RUN_IN_SQL_EDITOR.sql
-- Expected: tables_count=7, policies_count>=16, functions_count=8, enums_count=3
-- ============================================================

select
  (select count(*) from information_schema.tables
   where table_schema = 'public'
     and table_name in ('tournaments','teams','players','player_groups','player_group_members','auction_state','bid_events')
  ) as tables_count,
  (select count(*) from pg_policies where schemaname = 'public') as policies_count,
  (select count(*) from pg_proc
   where pronamespace = 'public'::regnamespace
     and proname in ('is_admin','start_shuffle','finalize_on_block','place_bid','sell_player','pass_player','revert_last_bid','revert_sale')
  ) as functions_count,
  (select count(*) from pg_type
   where typnamespace = 'public'::regnamespace
     and typname in ('tournament_status','player_status','bid_mode')
  ) as enums_count;

-- Optional: list what actually landed
-- select tablename from pg_tables where schemaname='public' order by 1;
-- select proname from pg_proc where pronamespace='public'::regnamespace and proname in ('is_admin','start_shuffle','finalize_on_block','place_bid','sell_player','pass_player','revert_last_bid','revert_sale') order by 1;
-- select policyname from pg_policies where schemaname='public' order by 1;