-- ============================================================
-- CRICZONE — 0002_rls.sql
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