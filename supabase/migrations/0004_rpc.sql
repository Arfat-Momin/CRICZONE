-- ============================================================
-- CRICZONE — 0004_rpc.sql
-- Atomic auction RPCs. All use security definer + is_admin() guard.
-- ============================================================

-- ---------- start_shuffle ----------
create or replace function start_shuffle(p_tournament_id uuid, p_shuffling_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then raise exception 'UNAUTHORIZED'; end if;

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

-- ---------- finalize_on_block ----------
create or replace function finalize_on_block(p_tournament_id uuid, p_player_id uuid)
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

  if v_prev is not null and v_prev <> p_player_id then
    update players set status = 'pending'
    where id = v_prev and status = 'on_block';
  end if;

  update players set status = 'on_block'
  where id = p_player_id and tournament_id = p_tournament_id;

  if not found then raise exception 'PLAYER_NOT_FOUND'; end if;

  insert into auction_state (tournament_id, current_player_id, shuffling_name, current_bid_price, current_highest_team_id)
  values (p_tournament_id, p_player_id, null, 0, null)
  on conflict (tournament_id) do update
    set current_player_id = excluded.current_player_id,
        shuffling_name = null,
        current_bid_price = 0,
        current_highest_team_id = null,
        updated_at = now();

  delete from bid_events where tournament_id = p_tournament_id;
end;
$$;

-- ---------- place_bid ----------
create or replace function place_bid(p_tournament_id uuid, p_team_id uuid)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_state auction_state;
  v_team teams;
  v_next numeric;
  v_bought int;
  v_max numeric;
begin
  if not is_admin() then raise exception 'UNAUTHORIZED'; end if;

  select * into v_state from auction_state where tournament_id = p_tournament_id for update;
  if not found then raise exception 'AUCTION_STATE_NOT_FOUND'; end if;
  if v_state.current_player_id is null then raise exception 'NO_PLAYER_ON_BLOCK'; end if;
  if v_state.current_highest_team_id = p_team_id then raise exception 'ALREADY_HIGHEST_BIDDER'; end if;

  select * into v_team from teams where id = p_team_id and tournament_id = p_tournament_id for update;
  if not found then raise exception 'TEAM_NOT_FOUND'; end if;

  if v_state.bid_mode = 'star' then
    v_next := case when v_state.current_bid_price = 0 then 1000 else v_state.current_bid_price + 1000 end;
  else
    v_next := case
      when v_state.current_bid_price = 0 then 1
      when v_state.current_bid_price < 5 then v_state.current_bid_price + 0.5
      else v_state.current_bid_price + 1
    end;
  end if;

  if v_team.points_remaining < v_next then raise exception 'INSUFFICIENT_POINTS'; end if;

  if v_team.max_players is not null then
    select count(*) into v_bought from players
      where sold_to_team_id = p_team_id and tournament_id = p_tournament_id;
    if v_bought >= v_team.max_players then raise exception 'SQUAD_FULL'; end if;
    v_max := v_team.points_remaining - greatest(0, (v_team.max_players - v_bought) - 1);
    if v_next > v_max then raise exception 'EXCEEDS_MAX_BID'; end if;
  end if;

  insert into bid_events (tournament_id, player_id, team_id, price)
  values (p_tournament_id, v_state.current_player_id, v_state.current_highest_team_id, v_state.current_bid_price);

  update auction_state
  set current_bid_price = v_next,
      current_highest_team_id = p_team_id,
      updated_at = now()
  where tournament_id = p_tournament_id;

  return v_next;
end;
$$;

-- ---------- revert_last_bid ----------
create or replace function revert_last_bid(p_tournament_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event bid_events;
begin
  if not is_admin() then raise exception 'UNAUTHORIZED'; end if;

  select * into v_event from bid_events
  where tournament_id = p_tournament_id
  order by id desc limit 1
  for update;

  if not found then
    update auction_state
    set current_bid_price = 0, current_highest_team_id = null, updated_at = now()
    where tournament_id = p_tournament_id;
    return;
  end if;

  delete from bid_events where id = v_event.id;

  update auction_state
  set current_bid_price = coalesce(v_event.price, 0),
      current_highest_team_id = v_event.team_id,
      updated_at = now()
  where tournament_id = p_tournament_id;
end;
$$;

-- ---------- sell_player ----------
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
  v_bought int;
begin
  if not is_admin() then raise exception 'UNAUTHORIZED'; end if;
  if p_price <= 0 then raise exception 'INVALID_PRICE'; end if;

  select * into v_player from players
    where id = p_player_id and tournament_id = p_tournament_id for update;
  if not found then raise exception 'PLAYER_NOT_FOUND'; end if;
  if v_player.status <> 'on_block' then raise exception 'PLAYER_NOT_ON_BLOCK'; end if;

  select * into v_team from teams
    where id = p_team_id and tournament_id = p_tournament_id for update;
  if not found then raise exception 'TEAM_NOT_FOUND'; end if;
  if v_team.points_remaining < p_price then raise exception 'INSUFFICIENT_POINTS'; end if;

  if v_team.max_players is not null then
    select count(*) into v_bought from players
      where sold_to_team_id = p_team_id and tournament_id = p_tournament_id;
    if v_bought >= v_team.max_players then raise exception 'SQUAD_FULL'; end if;
  end if;

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
      updated_at = now()
  where tournament_id = p_tournament_id;

  delete from bid_events where tournament_id = p_tournament_id;
end;
$$;

-- ---------- pass_player ----------
create or replace function pass_player(p_tournament_id uuid, p_player_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player players;
begin
  if not is_admin() then raise exception 'UNAUTHORIZED'; end if;

  select * into v_player from players
    where id = p_player_id and tournament_id = p_tournament_id for update;
  if not found then raise exception 'PLAYER_NOT_FOUND'; end if;
  if v_player.status <> 'on_block' then raise exception 'PLAYER_NOT_ON_BLOCK'; end if;

  update players set status = 'unsold' where id = p_player_id;

  update auction_state
  set current_player_id = null,
      shuffling_name = null,
      current_bid_price = 0,
      current_highest_team_id = null,
      updated_at = now()
  where tournament_id = p_tournament_id;

  delete from bid_events where tournament_id = p_tournament_id;
end;
$$;

-- ---------- revert_sale ----------
create or replace function revert_sale(p_tournament_id uuid, p_player_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_player players;
begin
  if not is_admin() then raise exception 'UNAUTHORIZED'; end if;

  select * into v_player from players
    where id = p_player_id and tournament_id = p_tournament_id for update;
  if not found then raise exception 'PLAYER_NOT_FOUND'; end if;
  if v_player.status <> 'sold' then raise exception 'PLAYER_NOT_SOLD'; end if;
  if v_player.sold_to_team_id is null then raise exception 'NO_TEAM_TO_REFUND'; end if;

  update teams
  set points_remaining = points_remaining + coalesce(v_player.selling_price, 0)
  where id = v_player.sold_to_team_id;

  update players
  set status = 'pending', selling_price = 0, sold_to_team_id = null
  where id = p_player_id;
end;
$$;