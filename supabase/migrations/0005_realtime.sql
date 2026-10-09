-- ============================================================
-- CRICZONE — 0005_realtime.sql
-- Add all 7 tables to the supabase_realtime publication.
-- ============================================================

do $$ begin alter publication supabase_realtime add table tournaments;          exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table teams;                exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table players;              exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table player_groups;        exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table player_group_members; exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table auction_state;        exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table bid_events;           exception when duplicate_object then null; when undefined_object then null; end $$;