-- ============================================================
-- FILE: supabase/migrations/0001_init.sql
-- ============================================================
-- ============================================================
-- CRICZONE â€” 0001_init.sql
-- Enums, tables, constraints, indexes. Idempotent.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- ENUMS ----------
do $$ begin
  create type tournament_status as enum ('draft','registration','ready','live','ended','archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type player_status as enum ('pending','on_block','sold','unsold','skipped');
exception when duplicate_object then null; end $$;

do $$ begin
  create type bid_mode as enum ('normal','star');
exception when duplicate_object then null; end $$;

-- ---------- TOURNAMENTS ----------
create table if not exists tournaments (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  venue text,
  auction_start_at timestamptz,
  status tournament_status not null default 'draft',
  registration_enabled boolean not null default true,
  grouping_enabled boolean not null default false,
  form_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- TEAMS ----------
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  team_name text not null,
  captain_name text,
  photo_url text,
  points_remaining numeric not null default 100,
  max_players int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teams_team_name_unique unique (tournament_id, team_name),
  constraint teams_points_nonneg check (points_remaining >= 0),
  constraint teams_max_players_pos check (max_players is null or max_players > 0)
);

-- ---------- PLAYERS ----------
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  first_name text,
  surname text,
  full_name text not null,
  mobile_no text,
  jersey_no int,
  jersey_size text,
  category text,
  current_team text,
  photo_url text,
  base_price numeric not null default 1,
  status player_status not null default 'pending',
  selling_price numeric default 0,
  sold_to_team_id uuid references teams(id) on delete set null,
  custom_fields jsonb not null default '{}'::jsonb,
  registered_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint players_base_price_pos check (base_price >= 0),
  constraint players_selling_price_pos check (selling_price is null or selling_price >= 0),
  constraint players_tournament_id_id_unique unique (tournament_id, id)
);

create unique index if not exists players_tournament_mobile_unique
  on players(tournament_id, mobile_no)
  where mobile_no is not null;

-- ---------- PLAYER GROUPS ----------
create table if not exists player_groups (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  constraint player_groups_name_unique unique (tournament_id, name),
  constraint player_groups_tournament_id_id_unique unique (tournament_id, id)
);

create table if not exists player_group_members (
  tournament_id uuid not null,
  group_id uuid not null,
  player_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (group_id, player_id),
  foreign key (tournament_id, group_id) references player_groups(tournament_id, id) on delete cascade,
  foreign key (tournament_id, player_id) references players(tournament_id, id) on delete cascade,
  constraint player_group_members_one_group_per_player unique (tournament_id, player_id)
);

-- ---------- AUCTION STATE ----------
create table if not exists auction_state (
  tournament_id uuid primary key references tournaments(id) on delete cascade,
  current_player_id uuid references players(id) on delete set null,
  shuffling_name text,
  current_bid_price numeric not null default 0,
  current_highest_team_id uuid references teams(id) on delete set null,
  bid_mode bid_mode not null default 'normal',
  updated_at timestamptz not null default now()
);

-- ---------- BID EVENTS ----------
create table if not exists bid_events (
  id bigserial primary key,
  tournament_id uuid not null references tournaments(id) on delete cascade,
  player_id uuid references players(id) on delete set null,
  team_id uuid references teams(id) on delete set null,
  price numeric not null,
  created_at timestamptz not null default now()
);

-- ---------- INDEXES ----------
create index if not exists idx_teams_tournament on teams(tournament_id);
create index if not exists idx_players_tournament on players(tournament_id);
create index if not exists idx_players_tournament_status on players(tournament_id, status);
create index if not exists idx_players_sold_to on players(sold_to_team_id) where sold_to_team_id is not null;
create index if not exists idx_player_groups_tournament on player_groups(tournament_id);
create index if not exists idx_player_group_members_player on player_group_members(player_id);
create index if not exists idx_bid_events_tournament_player on bid_events(tournament_id, player_id, id desc);

-- ============================================================
-- FILE: supabase/migrations/0002_rls.sql
-- ============================================================
-- ============================================================
-- CRICZONE â€” 0002_rls.sql
-- is_admin() helper, RLS enablement, policies, storage bucket.
-- ============================================================

-- is_admin(): true for service_role OR the configured admin email.
create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    auth.role() = 'service_role'
    or coalesce(auth.email() = 'arfatmomin7709@gmail.com', false);
$$;

-- ---------- ENABLE RLS ----------
alter table tournaments           enable row level security;
alter table teams                 enable row level security;
alter table players               enable row level security;
alter table player_groups         enable row level security;
alter table player_group_members  enable row level security;
alter table auction_state         enable row level security;
alter table bid_events            enable row level security;

-- ---------- TOURNAMENTS ----------
drop policy if exists tournaments_public_read on tournaments;
create policy tournaments_public_read on tournaments
  for select to anon, authenticated
  using (status in ('registration','ready','live','ended','archived'));

drop policy if exists tournaments_admin_write on tournaments;
create policy tournaments_admin_write on tournaments
  for all to authenticated
  using (is_admin()) with check (is_admin());

-- ---------- TEAMS ----------
drop policy if exists teams_public_read on teams;
create policy teams_public_read on teams
  for select to anon, authenticated
  using (exists (
    select 1 from tournaments t
    where t.id = teams.tournament_id
      and t.status in ('registration','ready','live','ended','archived')
  ));

drop policy if exists teams_admin_write on teams;
create policy teams_admin_write on teams
  for all to authenticated
  using (is_admin()) with check (is_admin());

-- ---------- PLAYERS ----------
drop policy if exists players_public_read on players;
create policy players_public_read on players
  for select to anon, authenticated
  using (exists (
    select 1 from tournaments t
    where t.id = players.tournament_id
      and t.status in ('registration','ready','live','ended','archived')
  ));

drop policy if exists players_admin_write on players;
create policy players_admin_write on players
  for all to authenticated
  using (is_admin()) with check (is_admin());

-- ---------- PLAYER GROUPS ----------
drop policy if exists player_groups_public_read on player_groups;
create policy player_groups_public_read on player_groups
  for select to anon, authenticated
  using (exists (
    select 1 from tournaments t
    where t.id = player_groups.tournament_id
      and t.status in ('registration','ready','live','ended','archived')
  ));

drop policy if exists player_groups_admin_write on player_groups;
create policy player_groups_admin_write on player_groups
  for all to authenticated
  using (is_admin()) with check (is_admin());

-- ---------- PLAYER GROUP MEMBERS ----------
drop policy if exists player_group_members_public_read on player_group_members;
create policy player_group_members_public_read on player_group_members
  for select to anon, authenticated
  using (exists (
    select 1 from tournaments t
    where t.id = player_group_members.tournament_id
      and t.status in ('registration','ready','live','ended','archived')
  ));

drop policy if exists player_group_members_admin_write on player_group_members;
create policy player_group_members_admin_write on player_group_members
  for all to authenticated
  using (is_admin()) with check (is_admin());

-- ---------- AUCTION STATE ----------
drop policy if exists auction_state_public_read on auction_state;
create policy auction_state_public_read on auction_state
  for select to anon, authenticated
  using (exists (
    select 1 from tournaments t
    where t.id = auction_state.tournament_id
      and t.status in ('registration','ready','live','ended','archived')
  ));

drop policy if exists auction_state_admin_write on auction_state;
create policy auction_state_admin_write on auction_state
  for all to authenticated
  using (is_admin()) with check (is_admin());

-- ---------- BID EVENTS ----------
drop policy if exists bid_events_public_read on bid_events;
create policy bid_events_public_read on bid_events
  for select to anon, authenticated
  using (exists (
    select 1 from tournaments t
    where t.id = bid_events.tournament_id
      and t.status in ('registration','ready','live','ended','archived')
  ));

drop policy if exists bid_events_admin_write on bid_events;
create policy bid_events_admin_write on bid_events
  for all to authenticated
  using (is_admin()) with check (is_admin());

-- ---------- STORAGE BUCKET ----------
insert into storage.buckets (id, name, public)
values ('player-photos', 'player-photos', true)
on conflict (id) do nothing;

drop policy if exists "player_photos_public_read" on storage.objects;
create policy "player_photos_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'player-photos');

drop policy if exists "player_photos_admin_insert" on storage.objects;
create policy "player_photos_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'player-photos' and is_admin());

drop policy if exists "player_photos_admin_update" on storage.objects;
create policy "player_photos_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'player-photos' and is_admin())
  with check (bucket_id = 'player-photos' and is_admin());

drop policy if exists "player_photos_admin_delete" on storage.objects;
create policy "player_photos_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'player-photos' and is_admin());

-- ============================================================
-- FILE: supabase/migrations/0003_triggers.sql
-- ============================================================
-- ============================================================
-- CRICZONE â€” 0003_triggers.sql
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

-- ============================================================
-- FILE: supabase/migrations/0004_rpc.sql
-- ============================================================
-- ============================================================
-- CRICZONE â€” 0004_rpc.sql
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

-- ============================================================
-- FILE: supabase/migrations/0005_realtime.sql
-- ============================================================
-- ============================================================
-- CRICZONE â€” 0005_realtime.sql
-- Add all 7 tables to the supabase_realtime publication.
-- ============================================================

do $$ begin alter publication supabase_realtime add table tournaments;          exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table teams;                exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table players;              exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table player_groups;        exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table player_group_members; exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table auction_state;        exception when duplicate_object then null; when undefined_object then null; end $$;
do $$ begin alter publication supabase_realtime add table bid_events;           exception when duplicate_object then null; when undefined_object then null; end $$;

