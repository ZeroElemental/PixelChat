-- Seed a profile from the username supplied at signup. The unique index on
-- lower(username) is the real enforcement; a clash surfaces as a signup error.
create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data ->> 'username');
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Accept must be atomic and must verify a pending request actually exists --
-- the old friendController did neither, so anyone could force-friend anyone.
create or replace function public.accept_friend_request(request_from uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  me   uuid := (select auth.uid());
  conv uuid;
begin
  if me is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  update public.friendships
     set status = 'accepted', updated_at = now()
   where requester_id = request_from
     and addressee_id = me
     and status = 'pending'
  returning conversation_id into conv;

  if not found then
    raise exception 'no pending friend request from that user' using errcode = 'P0002';
  end if;

  if conv is null then
    insert into public.conversations default values returning id into conv;
    insert into public.conversation_members (conversation_id, user_id)
      values (conv, me), (conv, request_from);
    update public.friendships
       set conversation_id = conv
     where requester_id = request_from and addressee_id = me;
  end if;

  return conv;
end;
$$;
-- Postgres grants EXECUTE to PUBLIC by default; revoke before granting narrowly.
revoke execute on function public.accept_friend_request(uuid) from public, anon;
grant  execute on function public.accept_friend_request(uuid) to authenticated;
