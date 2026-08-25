-- Deleting an account cascades their conversation_members rows but leaves the
-- conversation itself behind, unreachable and unreadable. Reap it once the last
-- member is gone so orphans don't accumulate.
create or replace function private.reap_empty_conversations()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from public.conversations c
   where not exists (
     select 1 from public.conversation_members m where m.conversation_id = c.id
   );
  return null;
end;
$$;

create trigger conversation_members_after_delete
  after delete on public.conversation_members
  for each statement execute function private.reap_empty_conversations();
