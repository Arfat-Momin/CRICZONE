-- ============================================================
-- CRICZONE — 0003_triggers.sql
-- updated_at auto-touch + clear auction_state on player leave.
-- ============================================================

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_tournaments_updated_at on tournaments;
create trigger trg_tournaments_updated_at
  before update on tournaments
  for each row execute function set_updated_at();

drop trigger if exists trg_teams_updated_at on teams;
create trigger trg_teams_updated_at
  before update on teams
  for each row execute function set_updated_at();

drop trigger if exists trg_players_updated_at on players;
create trigger trg_players_updated_at
  before update on players
  for each row execute function set_updated_at();

drop trigger if exists trg_auction_state_updated_at on auction_state;
create trigger trg_auction_state_updated_at
  before update on auction_state
  for each row execute function set_updated_at();

-- Clear auction_state when a player leaves on_block (via direct update).
create or replace function clear_auction_state_on_player_leave()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'on_block' and new.status <> 'on_block' then
    update auction_state
    set current_player_id = null
    where tournament_id = new.tournament_id
      and current_player_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_players_clear_state on players;
create trigger trg_players_clear_state
  after update of status on players
  for each row execute function clear_auction_state_on_player_leave();