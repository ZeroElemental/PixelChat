-- Private schema: helpers that must bypass RLS. Never exposed to the Data API.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Cast that fails closed instead of raising. Used wherever a uuid is parsed out of
-- an untrusted string (realtime topics, storage object paths).
create or replace function private.uuid_or_null(t text)
returns uuid language plpgsql immutable as $$
begin return t::uuid; exception when others then return null; end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null check (username ~ '^[A-Za-z0-9_]{3,24}$'),
  avatar_url text,
  created_at timestamptz not null default now()
);
create unique index profiles_username_lower_key on public.profiles (lower(username));

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz not null default 'epoch',
  primary key (conversation_id, user_id)
);
create index conversation_members_user_idx on public.conversation_members (user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text,
  attachment_path text,
  attachment_name text,
  kind text not null default 'text' check (kind in ('text','image','file')),
  created_at timestamptz not null default now(),
  constraint messages_payload_ck check (
    (kind = 'text'  and attachment_path is null and body is not null and char_length(body) between 1 and 4000)
    or (kind <> 'text' and attachment_path is not null)
  )
);
create index messages_conversation_created_idx on public.messages (conversation_id, created_at desc);

create table public.friendships (
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','blocked')),
  conversation_id uuid references public.conversations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (requester_id, addressee_id),
  constraint friendships_no_self_ck check (requester_id <> addressee_id)
);
-- One relationship per pair regardless of who asked first.
create unique index friendships_pair_key
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index friendships_addressee_idx on public.friendships (addressee_id);

-- Answers only "is the CALLER a member", so it cannot leak anything about other users.
-- security definer is required: a policy on conversation_members that reads
-- conversation_members would recurse.
create or replace function private.is_member(conv uuid)
returns boolean language sql security definer set search_path = '' stable as $$
  select exists (
    select 1 from public.conversation_members m
    where m.conversation_id = conv and m.user_id = (select auth.uid())
  );
$$;
grant execute on function private.is_member(uuid) to authenticated;
