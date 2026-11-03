-- Escudo Guardián: esquema de la base de datos en Supabase.
-- Pegar completo en Supabase → SQL Editor → Run. Se puede ejecutar más de una vez.
--
-- Seguridad: Row Level Security (RLS) activo en todas las tablas. Cada usuario solo puede
-- leer y escribir SUS filas (auth.uid() = user_id). La clave pública de la app no da acceso
-- a datos de otros usuarios.

-- Estado de cada usuario: perfil, criatura y ajustes (documentos JSON validados por la app).
create table if not exists public.user_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  profile jsonb,
  creature jsonb,
  settings jsonb,
  updated_at timestamptz not null default now()
);

-- Historial de análisis: una fila por análisis.
create table if not exists public.history_entries (
  user_id uuid not null references auth.users (id) on delete cascade,
  id text not null,
  at timestamptz not null,
  entry jsonb not null,
  primary key (user_id, id)
);

create index if not exists history_entries_user_at on public.history_entries (user_id, at desc);

alter table public.user_state enable row level security;
alter table public.history_entries enable row level security;

drop policy if exists "user_state: own rows" on public.user_state;
create policy "user_state: own rows" on public.user_state
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "history_entries: own rows" on public.history_entries;
create policy "history_entries: own rows" on public.history_entries
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
