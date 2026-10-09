-- ============================================================
-- CRICZONE — 0007_auction_fixes.sql
-- 1. Full-row realtime delivery for status change detection
-- 2. start_shuffle: revert previous on-block player atomically
-- ============================================================

alter table public.players       replica identity full;
alter table public.teams         replica identity full;
alter table public.auction_state replica identity full;

create or replace function start_shuffle(p_tournament_id uuid, p_shuffling_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prev uuid;
begin
  if not is_admin() then raise exception 'UNAUTHORIZED'; end if;

  select current_player_id into v_prev
  from auction_state
  where tournament_id = p_tournament_id
  for update;

  if v_prev is not null then
    update players set status = 'pending'
    where id = v_prev and status = 'on_block';
  end if;

  delete from bid_events where tournament_id = p_tournament_id;

  insert into auction_state (tournament_id, shuffling_name, current_player_id, current_bid_price, current_highest_team_id)
  values (p_tournament_id, p_shuffling_name, null, 0, null)
  on conflict (tournament_id) do update
    set shuffling_name = excluded.shuffling_name,
        current_player_id = null,
        current_bid_price = 0,
        current_highest_team_id = null,
        updated_at = now();
end;
$$;