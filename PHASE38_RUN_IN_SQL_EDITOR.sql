-- ============================================================
-- CRICZONE — 0011_sell_player_max_bid.sql
-- sell_player now enforces the same reserve rule as place_bid:
-- a team must retain enough points to afford the base price for
-- every slot it still needs to fill.
-- ============================================================

create or replace function sell_player(
  p_tournament_id uuid,
  p_player_id uuid,
  p_team_id uuid,
  p_price numeric
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team teams;
  v_player players;
  v_state auction_state;
  v_bought int;
  v_min_per_slot numeric;
  v_slots_remaining int;
  v_max_bid numeric;
begin
  if not is_admin() then raise exception 'UNAUTHORIZED'; end if;
  if p_price <= 0 then raise exception 'INVALID_PRICE'; end if;

  -- Player must be on block
  select * into v_player from players
    where id = p_player_id and tournament_id = p_tournament_id for update;
  if not found then raise exception 'PLAYER_NOT_FOUND'; end if;
  if v_player.status <> 'on_block' then raise exception 'PLAYER_NOT_ON_BLOCK'; end if;

  -- Team must exist
  select * into v_team from teams
    where id = p_team_id and tournament_id = p_tournament_id for update;
  if not found then raise exception 'TEAM_NOT_FOUND'; end if;

  -- Team must have enough points for the raw price
  if v_team.points_remaining < p_price then
    raise exception 'INSUFFICIENT_POINTS';
  end if;

  -- If the team has a slot cap, enforce the reserve rule
  if v_team.max_players is not null then
    select count(*) into v_bought from players
      where sold_to_team_id = p_team_id and tournament_id = p_tournament_id;

    if v_bought >= v_team.max_players then
      raise exception 'SQUAD_FULL';
    end if;

    -- Compute the minimum per-slot price (star base or 1 pt in normal)
    select * into v_state from auction_state where tournament_id = p_tournament_id;
    v_min_per_slot := case
      when v_state.bid_mode = 'star' then greatest(1, v_state.star_base_price)
      else 1
    end;

    v_slots_remaining := v_team.max_players - v_bought;
    -- Reserve (slots_remaining - 1) × min_per_slot for future players.
    -- The remaining slot (the one being filled now) doesn't need reservation.
    v_max_bid := v_team.points_remaining
               - greatest(0, (v_slots_remaining - 1) * v_min_per_slot);

    if p_price > v_max_bid then
      raise exception 'EXCEEDS_MAX_BID: % pts exceeds team max % pts (reserves % pt/slot × % remaining slot(s))',
        p_price, v_max_bid, v_min_per_slot, v_slots_remaining - 1;
    end if;
  end if;

  -- ---------- Perform the sale ----------
  update players
  set status = 'sold', selling_price = p_price, sold_to_team_id = p_team_id
  where id = p_player_id;

  update teams
  set points_remaining = points_remaining - p_price
  where id = p_team_id;

  update auction_state
  set current_player_id = null,
      shuffling_name = null,
      current_bid_price = 0,
      current_highest_team_id = null,
      star_bid_count = 0,
      updated_at = now()
  where tournament_id = p_tournament_id;

  delete from bid_events where tournament_id = p_tournament_id;
end;
$$;