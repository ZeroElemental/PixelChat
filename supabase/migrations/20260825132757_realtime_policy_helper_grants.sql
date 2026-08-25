-- RLS policy expressions are evaluated with the table owner's privileges.
-- realtime.messages is owned by supabase_realtime_admin, which has no access to
-- the postgres-owned `private` schema, so the authorization policies silently
-- denied every join. Grant USAGE plus EXECUTE on just these three helpers --
-- not ALL FUNCTIONS, and the schema stays out of the exposed API either way.
grant usage on schema private to supabase_realtime_admin, authenticated;

grant execute on function private.is_member(uuid)      to supabase_realtime_admin, authenticated;
grant execute on function private.topic_conversation() to supabase_realtime_admin, authenticated;
grant execute on function private.topic_user()         to supabase_realtime_admin, authenticated;
grant execute on function private.uuid_or_null(text)   to supabase_realtime_admin, authenticated;
