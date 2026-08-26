-- Topic parsers. Fail closed: a malformed topic yields null, and is_member(null)
-- is false rather than an error.
create or replace function private.topic_conversation()
returns uuid language sql stable set search_path = '' as $$
  select private.uuid_or_null(substring(realtime.topic() from '^conversation:(.*)$'));
$$;

create or replace function private.topic_user()
returns uuid language sql stable set search_path = '' as $$
  select private.uuid_or_null(substring(realtime.topic() from '^user:(.*)$'));
$$;

-- One channel per conversation carries both the messages (broadcast) and the
-- online/typing state (presence), so no global presence channel is needed --
-- you can only ever see the status of people you actually share a chat with.
create policy conversation_topic_read on realtime.messages
  for select to authenticated
  using (
    extension in ('broadcast', 'presence')
    and private.is_member(private.topic_conversation())
  );

create policy conversation_topic_write on realtime.messages
  for insert to authenticated
  with check (
    extension in ('broadcast', 'presence')
    and private.is_member(private.topic_conversation())
  );

-- Private inbox for friend-request notifications. Read-only for clients: only
-- the definer-rights trigger below can write here, so notifications can't be forged.
create policy user_topic_read on realtime.messages
  for select to authenticated
  using (extension = 'broadcast' and private.topic_user() = (select auth.uid()));

-- Replaces the old client-side broadcast: the row is persisted first, then the
-- server fans it out. A sender can no longer emit a message it did not write.
create or replace function private.on_message_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.conversations
     set last_message_at = new.created_at
   where id = new.conversation_id;

  perform realtime.send(
    to_jsonb(new),
    'new_message',
    'conversation:' || new.conversation_id::text,
    true
  );
  return null;
end;
$$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_after_insert
  after insert on public.messages
  for each row execute function private.on_message_insert();

create or replace function private.on_friendship_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform realtime.send(
    jsonb_build_object('status', new.status, 'requester_id', new.requester_id),
    'friendship',
    'user:' || (case when tg_op = 'INSERT' then new.addressee_id else new.requester_id end)::text,
    true
  );
  return null;
end;
$$;

create trigger friendships_after_change
  after insert or update on public.friendships
  for each row execute function private.on_friendship_change();
