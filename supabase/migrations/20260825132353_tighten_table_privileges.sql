-- Supabase ships ALTER DEFAULT PRIVILEGES granting ALL on every new public
-- table to anon and authenticated, so the narrow grants written earlier were
-- additive and changed nothing. Strip the blanket grants, stop them applying to
-- future tables, then re-grant exactly what each role needs. RLS is the row
-- filter; these privileges are the column/verb filter underneath it.
revoke all on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;

-- anon gets no table access at all: nothing here is readable signed out.

grant select                              on public.profiles             to authenticated;
grant update (username, avatar_url)       on public.profiles             to authenticated;

grant select                              on public.conversations        to authenticated;

grant select                              on public.conversation_members to authenticated;
grant update (last_read_at)               on public.conversation_members to authenticated;

grant select, insert                      on public.messages             to authenticated;

grant select, insert, delete              on public.friendships          to authenticated;
