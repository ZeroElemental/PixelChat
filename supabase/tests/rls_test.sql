-- Security regression test for the row-level security policies.
--
-- Run it against any PixelChat database; it seeds its own users, asserts, and
-- cleans up after itself. Any failure raises, so a non-zero exit / red error in
-- the SQL editor means a policy regressed.
--
--   supabase db execute --file supabase/tests/rls_test.sql
--
-- These assertions map one-to-one onto holes the pre-rebuild Express server had.

begin;

do $$
declare
  alice uuid := '11111111-1111-4111-8111-111111111111';
  bob   uuid := '22222222-2222-4222-8222-222222222222';
  carol uuid := '33333333-3333-4333-8333-333333333333';
  conv  uuid;
  n     int;
  failures text[] := '{}';
begin
  -- ---- fixtures ----------------------------------------------------------
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
                          email_confirmed_at, created_at, updated_at,
                          raw_app_meta_data, raw_user_meta_data)
  select '00000000-0000-0000-0000-000000000000', t.id, 'authenticated', 'authenticated',
         t.email, '', now(), now(), now(),
         '{"provider":"email","providers":["email"]}'::jsonb,
         jsonb_build_object('username', t.username)
  from (values
    (alice, 'rlstest_alice@pixelchat.invalid', 'rlstest_alice'),
    (bob,   'rlstest_bob@pixelchat.invalid',   'rlstest_bob'),
    (carol, 'rlstest_carol@pixelchat.invalid', 'rlstest_carol')
  ) as t(id, email, username);

  -- alice befriends bob through the real code path
  execute 'set local role authenticated';
  execute format('set local request.jwt.claims = %L',
                 json_build_object('sub', alice, 'role', 'authenticated')::text);
  insert into public.friendships (requester_id, addressee_id, status)
  values (alice, bob, 'pending');

  execute format('set local request.jwt.claims = %L',
                 json_build_object('sub', bob, 'role', 'authenticated')::text);
  conv := public.accept_friend_request(alice);

  execute format('set local request.jwt.claims = %L',
                 json_build_object('sub', alice, 'role', 'authenticated')::text);
  insert into public.messages (conversation_id, sender_id, body, kind)
  values (conv, alice, 'hello bob', 'text');

  -- ---- positive controls -------------------------------------------------
  execute format('set local request.jwt.claims = %L',
                 json_build_object('sub', bob, 'role', 'authenticated')::text);
  select count(*) into n from public.messages where conversation_id = conv;
  if n <> 1 then failures := failures || 'a member cannot read their own conversation'; end if;

  select count(*) into n from public.my_conversations();
  if n <> 1 then failures := failures || 'my_conversations() does not return the member''s chat'; end if;

  begin
    update public.conversation_members set last_read_at = now()
     where user_id = bob and conversation_id = conv;
  exception when others then
    failures := failures || ('marking a conversation read is blocked: ' || sqlerrm);
  end;

  -- ---- isolation: carol is in nothing ------------------------------------
  execute format('set local request.jwt.claims = %L',
                 json_build_object('sub', carol, 'role', 'authenticated')::text);

  select count(*) into n from public.messages;
  if n <> 0 then failures := failures || 'a non-member can read messages'; end if;
  select count(*) into n from public.conversations;
  if n <> 0 then failures := failures || 'a non-member can read conversations'; end if;
  select count(*) into n from public.conversation_members;
  if n <> 0 then failures := failures || 'a non-member can read conversation members'; end if;
  select count(*) into n from public.my_conversations();
  if n <> 0 then failures := failures || 'my_conversations() leaks to a non-member'; end if;

  -- ---- writes that must be refused ---------------------------------------
  begin
    insert into public.messages (conversation_id, sender_id, body, kind)
    values (conv, carol, 'intruder', 'text');
    failures := failures || 'a non-member can post into a conversation';
  exception when others then null; end;

  begin
    perform public.accept_friend_request(alice);
    failures := failures || 'a friend request can be accepted when none is pending';
  exception when others then null; end;

  begin
    insert into public.friendships (requester_id, addressee_id, status)
    values (alice, carol, 'accepted');
    failures := failures || 'a friendship can be inserted pre-accepted on someone else''s behalf';
  exception when others then null; end;

  execute format('set local request.jwt.claims = %L',
                 json_build_object('sub', alice, 'role', 'authenticated')::text);

  begin
    insert into public.messages (conversation_id, sender_id, body, kind)
    values (conv, bob, 'forged', 'text');
    failures := failures || 'a message can be forged with another user as sender';
  exception when others then null; end;

  begin
    update public.messages set body = 'tampered' where conversation_id = conv;
    failures := failures || 'a stored message can be edited';
  exception when others then null; end;

  begin
    delete from public.messages where conversation_id = conv;
    failures := failures || 'a stored message can be deleted';
  exception when others then null; end;

  begin
    update public.conversation_members set conversation_id = gen_random_uuid()
     where user_id = alice;
    failures := failures || 'a member can move their membership to another conversation';
  exception when others then null; end;

  -- confirm nothing above actually mutated the row
  execute 'reset role';
  select count(*) into n from public.messages where conversation_id = conv and body = 'hello bob';
  if n <> 1 then failures := failures || 'the stored message was modified'; end if;

  -- ---- report ------------------------------------------------------------
  if array_length(failures, 1) is not null then
    raise exception E'RLS TEST FAILED:\n  - %', array_to_string(failures, E'\n  - ');
  end if;

  raise notice 'RLS test passed: all isolation and integrity assertions held.';
end $$;

-- fixtures are discarded with the transaction
rollback;
