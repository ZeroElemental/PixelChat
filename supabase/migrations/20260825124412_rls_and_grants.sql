alter table public.profiles             enable row level security;
alter table public.conversations        enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages             enable row level security;
alter table public.friendships          enable row level security;

grant usage on schema public to authenticated;

create policy profiles_select on public.profiles
  for select to authenticated using (true);
create policy profiles_update_own on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);
-- No insert policy: profiles are created only by the auth.users trigger.

create policy conversations_select_member on public.conversations
  for select to authenticated using (private.is_member(id));
-- No insert: conversations are created only by accept_friend_request().

create policy conversation_members_select on public.conversation_members
  for select to authenticated using (private.is_member(conversation_id));
create policy conversation_members_update_own on public.conversation_members
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy messages_select_member on public.messages
  for select to authenticated using (private.is_member(conversation_id));
-- Forcing sender_id = auth.uid() here is what makes sender identity unspoofable.
create policy messages_insert_own on public.messages
  for insert to authenticated
  with check (sender_id = (select auth.uid()) and private.is_member(conversation_id));

create policy friendships_select_involved on public.friendships
  for select to authenticated
  using ((select auth.uid()) in (requester_id, addressee_id));
create policy friendships_insert_own on public.friendships
  for insert to authenticated
  with check (requester_id = (select auth.uid()) and status = 'pending');
create policy friendships_delete_involved on public.friendships
  for delete to authenticated
  using ((select auth.uid()) in (requester_id, addressee_id));
-- Status changes go through accept_friend_request() only. Table privileges are
-- set in 20260825132353_tighten_table_privileges.sql.
