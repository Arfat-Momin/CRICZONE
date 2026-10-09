-- ============================================================
-- CRICZONE — 0006_player_contacts.sql
-- Move mobile_no off players into a separate, admin-only table.
-- Prevents anon API callers from scraping mobile numbers.
-- ============================================================

-- 1. New table
create table if not exists public.player_contacts (
  player_id uuid primary key references public.players(id) on delete cascade,
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  mobile_no text not null,
  created_at timestamptz not null default now(),
  constraint player_contacts_tournament_mobile_unique unique (tournament_id, mobile_no)
);

create index if not exists idx_player_contacts_tournament
  on public.player_contacts(tournament_id);

-- 2. Migrate any existing rows
insert into public.player_contacts (player_id, tournament_id, mobile_no)
select id, tournament_id, mobile_no
from public.players
where mobile_no is not null
on conflict (player_id) do nothing;

-- 3. Remove mobile_no from players (also drops the old unique index)
alter table public.players drop column if exists mobile_no;

-- 4. RLS on player_contacts — admin only
alter table public.player_contacts enable row level security;

drop policy if exists player_contacts_admin_all on public.player_contacts;
create policy player_contacts_admin_all on public.player_contacts
  for all to authenticated
  using (is_admin()) with check (is_admin());

-- Note: anon CANNOT read player_contacts. Mobile numbers are never exposed publicly.