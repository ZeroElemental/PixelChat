-- security invoker: RLS still applies, so this can only ever return the caller's
-- own conversations. Unread count comes from conversation_members.last_read_at,
-- which is what makes a message land even when its chat isn't open.
create or replace function public.my_conversations()
returns table (
  conversation_id       uuid,
  other_id              uuid,
  other_username        text,
  other_avatar_url      text,
  last_message_at       timestamptz,
  last_message_preview  text,
  unread_count          bigint
)
language sql security invoker stable set search_path = '' as $$
  select c.id,
         op.id,
         op.username,
         op.avatar_url,
         c.last_message_at,
         (select case when m.kind = 'text' then m.body
                      else coalesce(m.attachment_name, m.kind) end
            from public.messages m
           where m.conversation_id = c.id
           order by m.created_at desc
           limit 1),
         (select count(*)
            from public.messages m
           where m.conversation_id = c.id
             and m.sender_id <> (select auth.uid())
             and m.created_at > mem.last_read_at)
    from public.conversation_members mem
    join public.conversations c   on c.id = mem.conversation_id
    join public.conversation_members om
      on om.conversation_id = c.id and om.user_id <> mem.user_id
    join public.profiles op       on op.id = om.user_id
   where mem.user_id = (select auth.uid())
   order by c.last_message_at desc;
$$;
grant execute on function public.my_conversations() to authenticated;
