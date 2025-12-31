-- Realtime and performance improvements for Adesto
-- - Atomic member counts via trigger
-- - Optional RPC to toggle membership
-- - Supporting indexes for common queries/realtime filters

-- Ensure we're in the public schema
set search_path = public;

------------------------------------------------------------
-- 1) Atomic member counts (spaces.members_count)
------------------------------------------------------------
create or replace function public.adjust_space_member_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.spaces
    set members_count = coalesce(members_count, 0) + 1
    where id = new.space_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.spaces
    set members_count = greatest(coalesce(members_count, 1) - 1, 0)
    where id = old.space_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_space_members_insert on public.space_members;
create trigger trg_space_members_insert
after insert on public.space_members
for each row
execute function public.adjust_space_member_count();

drop trigger if exists trg_space_members_delete on public.space_members;
create trigger trg_space_members_delete
after delete on public.space_members
for each row
execute function public.adjust_space_member_count();

------------------------------------------------------------
-- 2) Optional RPC: toggle_space_membership
--    Returns 'joined' or 'left' for the current authenticated user.
--    Uses auth.uid() so RLS must allow the function role to insert/delete.
------------------------------------------------------------
create or replace function public.toggle_space_membership(_space_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  existing uuid;
begin
  if uid is null then
    raise exception 'Not authenticated';
  end if;

  select space_id
    into existing
    from public.space_members
    where space_id = _space_id
      and user_id = uid
    limit 1;

  if existing is null then
    insert into public.space_members (space_id, user_id, role)
    values (_space_id, uid, 'member');
    return 'joined';
  else
    delete from public.space_members
    where space_id = _space_id
      and user_id = uid;
    return 'left';
  end if;
end;
$$;

-- Allow authenticated users to call the RPC (adjust role as needed).
grant execute on function public.toggle_space_membership(uuid) to authenticated;

------------------------------------------------------------
-- 3) Indexes to speed common queries and realtime filters
------------------------------------------------------------
-- Signals: scoped by space + date/hour
create index if not exists signals_space_date_hour_idx
  on public.signals (space_id, date, hour);

-- Messages: per-space timeline lookups (desc sort)
create index if not exists messages_space_created_idx
  on public.messages (space_id, created_at desc);

-- Membership lookups
create index if not exists space_members_user_idx
  on public.space_members (user_id);
create index if not exists space_members_space_idx
  on public.space_members (space_id);

-- Optional: category filtering on spaces
create index if not exists spaces_category_idx
  on public.spaces (category);

------------------------------------------------------------
-- Notes:
-- - If RLS is enabled, ensure the function owner has rights to update spaces
--   and to insert/delete from space_members (e.g., security definer with a
--   role that bypasses RLS or has appropriate policies).
-- - Client code should stop issuing manual members_count updates once this
--   trigger is in place (trigger keeps counts correct).
-- - The toggle_space_membership RPC is optional; you can keep using direct
--   inserts/deletes if you prefer.
------------------------------------------------------------

