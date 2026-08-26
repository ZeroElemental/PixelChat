-- Private bucket. Object paths are '<conversation_id>/<uuid>-<filename>', so the
-- first path segment is what the policies check membership against.
-- The old multer config had neither a size limit nor a type allowlist.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'attachments', 'attachments', false, 10485760,
  array['image/png','image/jpeg','image/gif','image/webp',
        'application/pdf','text/plain','application/zip']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy attachments_select_member on storage.objects
  for select to authenticated
  using (
    bucket_id = 'attachments'
    and private.is_member(private.uuid_or_null((storage.foldername(name))[1]))
  );

create policy attachments_insert_member on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'attachments'
    and owner_id = (select auth.uid())::text
    and private.is_member(private.uuid_or_null((storage.foldername(name))[1]))
  );
-- No update/delete policy: attachments are immutable, matching messages.
-- (If upsert is ever needed it requires INSERT + SELECT + UPDATE together.)
