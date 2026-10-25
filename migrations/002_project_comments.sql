-- Migration: 002_project_comments.sql
-- Description: Comment thread between a fellow and their campus mentors on a project.
--
-- Who can read and write a project's comments:
--   * the fellow who submitted the project
--   * Coding Mentors / Head of Campus of that project's campus
--   * the site owner
-- Everyone can delete only their own comments.
-- Relies on is_campus_mentor() and is_site_owner(), which already exist in the database.

-- 1) The table. project_id uses the same type as projects.id.
do $$
declare id_type text;
begin
  select format_type(atttypid, atttypmod) into id_type
  from pg_attribute
  where attrelid = 'public.projects'::regclass and attname = 'id';

  execute format($f$
    create table if not exists public.project_comments (
      id uuid primary key default gen_random_uuid(),
      project_id %s not null references public.projects(id) on delete cascade,
      author_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
      body text not null check (char_length(btrim(body)) between 1 and 2000),
      created_at timestamptz not null default now()
    )
  $f$, id_type);
end $$;

create index if not exists project_comments_project_idx
  on public.project_comments (project_id, created_at);

alter table public.project_comments enable row level security;

-- 2) Helper: may the logged-in person take part in this project's discussion?
do $$
declare id_type text;
begin
  select format_type(atttypid, atttypmod) into id_type
  from pg_attribute
  where attrelid = 'public.projects'::regclass and attname = 'id';

  execute format($f$
    create or replace function public.can_discuss_project(p_project %s)
    returns boolean
    language sql
    stable
    security definer
    set search_path = public
    as $body$
      select exists (
        select 1 from public.projects p
        where p.id = p_project
          and (p.created_by = auth.uid() or public.is_campus_mentor(p.campus_id) or public.is_site_owner())
      );
    $body$
  $f$, id_type);
end $$;

-- 3) Rules
drop policy if exists "Read comments on projects you can discuss" on public.project_comments;
create policy "Read comments on projects you can discuss" on public.project_comments
  for select to authenticated
  using (public.can_discuss_project(project_id));

drop policy if exists "Comment on projects you can discuss" on public.project_comments;
create policy "Comment on projects you can discuss" on public.project_comments
  for insert to authenticated
  with check (author_id = auth.uid() and public.can_discuss_project(project_id));

drop policy if exists "Delete your own comments" on public.project_comments;
create policy "Delete your own comments" on public.project_comments
  for delete to authenticated
  using (author_id = auth.uid());

-- Refresh the API so the new table is visible straight away
notify pgrst, 'reload schema';
