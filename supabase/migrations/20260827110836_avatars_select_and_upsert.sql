-- Marking the bucket public only opens the unauthenticated CDN read path; it
-- grants nothing on the storage.objects table itself. Without a select policy
-- the authenticated API cannot see an existing object, so upsert and delete both
-- fail -- exactly the "INSERT + SELECT + UPDATE together" case that
-- 20260825124623_storage_attachments.sql flags in its closing comment.
--
-- Scoping this to the caller's own folder would be pointless secrecy: the bucket
-- already serves every one of these files to anyone with the URL, and
-- profiles_select hands out every avatar_url. So it mirrors profiles: readable.
create policy avatars_select on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars');
