-- ============================================================
-- CRICZONE — 0008_global_settings.sql
-- Single-row global config table for site state.
-- ============================================================

create table if not exists public.global_settings (
  id text primary key default 'site',
  site_state text not null default 'online'
    check (site_state in ('online','maintenance')),
  updated_at timestamptz not null default now()
);

insert into public.global_settings (id, site_state)
values ('site', 'online')
on conflict (id) do nothing;

alter table public.global_settings enable row level security;

drop policy if exists global_settings_public_read on public.global_settings;
create policy global_settings_public_read on public.global_settings
  for select to anon, authenticated
  using (true);

drop policy if exists global_settings_admin_write on public.global_settings;
create policy global_settings_admin_write on public.global_settings
  for all to authenticated
  using (is_admin()) with check (is_admin());

-- Auto-update updated_at
create or replace function set_global_settings_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_global_settings_updated_at on public.global_settings;
create trigger trg_global_settings_updated_at
  before update on public.global_settings
  for each row execute function set_global_settings_updated_at();