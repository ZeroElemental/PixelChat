-- Self-service account deletion. There is no service-role key in this app, so
-- auth.admin.deleteUser() is not reachable; and 20260825132353_tighten_table_-
-- privileges.sql grants authenticated delete on friendships only, deliberately.
-- A security definer function is the way in, the same shape accept_friend_-
-- request() already uses.
--
-- Two steps, and the order matters:
--
--   1. conversations -- 20260825133149_reap_orphan_conversations.sql reaps on
--                       count = 0, so a two-person DM losing one member would
--                       leave the conversation, the peer's membership and the
--                       peer's messages behind, reachable by nobody. Deleting
--                       the conversation outright cascades all three. Correct
--                       because conversations here are always one-to-one.
--   2. auth.users    -- cascades profiles -> members, messages, friendships.
--
-- Storage is deliberately not touched here. Supabase installs a
-- storage.protect_delete() trigger that rejects any direct delete from
-- storage.objects -- 'Use the Storage API instead' -- so even the owner of this
-- function cannot clear those rows, and trying raises 42501 and aborts the whole
-- deletion. The client removes its own avatar through the Storage API before
-- calling this, which avatars_delete_own already permits and which deletes the
-- bytes properly.
--
-- ponytail: that leaves message attachments orphaned in the bucket. There is no
-- delete policy on attachments (immutable by design, see
-- 20260825124623_storage_attachments.sql) and no service role to bypass it with,
-- so nothing here can reach them. If orphaned attachment bytes ever cost enough
-- to matter, that is an edge function holding the service key, not this.
create or replace function public.delete_own_account()
returns void language plpgsql security definer set search_path = '' as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  delete from public.conversations c
   where exists (
     select 1 from public.conversation_members m
      where m.conversation_id = c.id and m.user_id = me
   );

  delete from auth.users where id = me;
end;
$$;

-- Postgres grants EXECUTE to PUBLIC by default; revoke before granting narrowly.
revoke execute on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;
