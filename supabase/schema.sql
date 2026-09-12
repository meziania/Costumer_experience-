-- Table unique : tout le store CX Systems (clients, projets, offres).
-- SQL Editor → Run. Puis Settings → API : copier URL + service_role dans Vercel.

create table if not exists public.cx_store (
  id int primary key default 1,
  data jsonb not null default '{"clients":[],"projects":[],"offers":[]}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.cx_store (id, data)
values (1, '{"clients":[],"projects":[],"offers":[]}'::jsonb)
on conflict (id) do nothing;

alter table public.cx_store enable row level security;

-- L’API serveur utilise service_role (bypass RLS). Pas d’accès anon.
revoke all on public.cx_store from anon, authenticated;
