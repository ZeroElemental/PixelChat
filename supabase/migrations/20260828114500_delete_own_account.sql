-- Self-service account deletion. There is no service-role key in this app, so
-- auth.admin.deleteUser() is not reachable; and 20260825132353_tighten_table_-
-- privileges.sql grants authenticated delete on friendships only, deliberately.
-- A security definer function is the way in, the same shape accept_friend_-
-- request() already uses.
--
-- The order of the four steps is the whole point:
--
--   1. attachments   -- messages.attachment_path is the only record of which
--                       objects were this user's, and messages.sender_id
--                       cascades, so the pointers must be read before step 4.
--   2. avatars       -- keyed on the '<user_id>/' path prefix.
--   3. conversations -- 20260825133149_reap_orphan_conversations.sql reaps on
--                       count = 0, so a two-person DM losing one member would
--                       leave the conversation, the peer's membership and the
--                       peer's messages behind, reachable by nobody. Deleting
--                       the conversation outright cascades all three. Correct
--                       because conversations here are always one-to-one.
--   4. auth.users    -- cascades profiles -> members, messages, friendships.
--
-- ponytail: steps 1 and 2 delete the storage.objects rows, which is what makes
-- the database consistent, but the underlying bytes stay in the bucket -- there
-- is no delete policy on attachments (they are immutable by design) and no
-- service role to call the storage API with. The client removes its own avatar
-- bytes before calling this, which avatars_delete_own already permits. If
-- orphaned attachment bytes ever matter, that is a scheduled job or an edge
-- function with the service key, not this function.
create or replace function public.delete_own_account()
returns void language plpgsql security definer set search_path = '' as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  delete from storage.objects
   where bucket_id = 'attachments'
     and name in (
       select m.attachment_path from public.messages m
        where m.sender_id = me and m.attachment_path is not null
     );

  delete from storage.objects
   where bucket_id = 'avatars'
     and (storage.foldername(name))[1] = me::text;

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
