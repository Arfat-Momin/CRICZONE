-- ============================================================
-- CRICZONE — 0001_init.sql
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