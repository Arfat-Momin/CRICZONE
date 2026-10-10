-- ============================================================
-- CRICZONE — 0009_tournament_poster.sql
-- Optional tournament poster (banner) shown on public pages.
-- ============================================================

alter table public.tournaments
  add column if not exists poster_url text;