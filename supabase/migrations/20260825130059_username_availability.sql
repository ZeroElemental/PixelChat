-- Signup happens while anonymous, so the profiles table (authenticated-only)
-- can't be read to pre-check a username. This returns a bare boolean and
-- nothing else. Username enumeration is already inherent to any signup form.
create or replace function public.username_available(candidate text)
returns boolean language sql security definer set search_path = '' stable as $$
  select candidate ~ '^[A-Za-z0-9_]{3,24}$'
     and not exists (
       select 1 from public.profiles p where lower(p.username) = lower(candidate)
     );
$$;
revoke execute on function public.username_available(text) from public;
grant  execute on function public.username_available(text) to anon, authenticated;
