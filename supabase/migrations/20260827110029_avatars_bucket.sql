-- Public bucket, unlike attachments. profiles_select is `using (true)`, so every
-- signed-in user can already read every avatar_url -- serving the image publicly
-- leaks nothing new, and it buys stable CDN-cacheable URLs instead of the 1-hour
-- signed URLs that message attachments have to re-mint on every render.
-- Object paths are '<user_id>/<uuid>.<ext>', so the first path segment is what
-- the policies check ownership against.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars', 'avatars', true, 2097152,
  array['image/png','image/jpeg','image/webp']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- No select policy: the bucket is public, so reads never reach RLS.
-- Insert + update + delete together are what make replacing an avatar an upsert,
-- the case 20260825124623_storage_attachments.sql deliberately left out for
-- attachments because those are immutable.
create policy avatars_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and owner_id = (select auth.uid())::text
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy avatars_update_own on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy avatars_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
