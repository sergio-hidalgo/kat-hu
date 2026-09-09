-- Like counts for /drops posts, keyed by the Sanity document `_id` so that
-- renaming a slug keeps a post's likes. Owned by spec 01.
--
-- This migration was originally applied through the Supabase dashboard and so
-- existed nowhere in the repo; spec 04 exported it from the live `kat-hu`
-- project (`laokeslruyqbcezjstij`) so a clean project can be rebuilt. It is
-- written to match what is already deployed, statement for statement — do not
-- "improve" it. Changes go in a new migration (`skills/db-schema`).

create table if not exists public.post_likes (
  post_id text not null
    constraint post_likes_id_format check (post_id ~ '^[A-Za-z0-9._-]{1,128}$'),
  likes integer not null default 0
    constraint post_likes_non_negative check (likes >= 0),
  updated_at timestamptz not null default now(),
  constraint post_likes_pkey primary key (post_id)
);

comment on table public.post_likes is
  'Like counts per Sanity post _id. Rows are created on first like.';

-- RLS on, and the only policy is a read. There is deliberately no insert or
-- update policy: the two RPCs below are the only way a counter moves, so the
-- worst a visitor holding the publishable key can do is move one row by one.
alter table public.post_likes enable row level security;

revoke all on table public.post_likes from anon, authenticated;
grant select on table public.post_likes to anon, authenticated;

create policy "post_likes are publicly readable"
  on public.post_likes
  for select
  to anon, authenticated
  using (true);

-- +1, returning the new total so the UI never has to guess.
-- `security definer` with an empty `search_path`: it runs as the owner, so
-- every object it touches is schema-qualified and nothing can be shadowed.
create or replace function public.like_post(p_post_id text)
returns integer
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_likes integer;
begin
  if p_post_id !~ '^[A-Za-z0-9._-]{1,128}$' then
    raise exception 'invalid post_id';
  end if;

  insert into public.post_likes as pl (post_id, likes)
  values (p_post_id, 1)
  on conflict (post_id) do update
    set likes = pl.likes + 1,
        updated_at = now()
  returning pl.likes into v_likes;

  return v_likes;
end;
$function$;

-- -1, floored at zero, so a double click or a cleared localStorage can never
-- drive a counter negative.
create or replace function public.unlike_post(p_post_id text)
returns integer
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_likes integer;
begin
  if p_post_id !~ '^[A-Za-z0-9._-]{1,128}$' then
    raise exception 'invalid post_id';
  end if;

  insert into public.post_likes as pl (post_id, likes)
  values (p_post_id, 0)
  on conflict (post_id) do update
    set likes = greatest(pl.likes - 1, 0),
        updated_at = now()
  returning pl.likes into v_likes;

  return v_likes;
end;
$function$;

-- Postgres grants EXECUTE to PUBLIC by default; revoke it and name the roles,
-- so the grant list is a decision rather than an inheritance.
revoke all on function public.like_post(text) from public;
revoke all on function public.unlike_post(text) from public;

grant execute on function public.like_post(text) to anon, authenticated, service_role;
grant execute on function public.unlike_post(text) to anon, authenticated, service_role;
