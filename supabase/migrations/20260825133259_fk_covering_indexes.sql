-- Covering indexes for the FK cascade scans that run on account deletion.
create index friendships_conversation_idx on public.friendships (conversation_id);
create index messages_sender_idx          on public.messages (sender_id);
