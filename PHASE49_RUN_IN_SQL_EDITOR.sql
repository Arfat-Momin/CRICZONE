-- ============================================================
-- CRICZONE — 0012_shuffle_enabled.sql
-- Adds a per-tournament toggle for the shuffle animation.
-- When false, the admin flow puts the player on block directly
-- and the public page skips the card cascade.
-- ============================================================

alter table public.auction_state
  add column if not exists shuffle_enabled boolean not null default true;

create or replace function set_shuffle_enabled(
  p_tournament_id uuid,
  p_enabled boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then raise exception 'UNAUTHORIZED'; end if;

  update auction_state
  set shuffle_enabled = p_enabled,
      updated_at = now()
  where tournament_id = p_tournament_id;

  -- If the toggle is turned off while a shuffle is in progress,
  -- clear the shuffling_name so clients fall through to the player card.
  if p_enabled = false then
    update auction_state
    set shuffling_name = null
    where tournament_id = p_tournament_id
      and shuffling_name is not null;
  end if;
end;
$$;