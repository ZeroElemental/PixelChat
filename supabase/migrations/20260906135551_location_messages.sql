-- Location messages: kind = 'location', with body holding "lat,lng".
-- No new columns -- a point is two numbers, and messages already carry a body.

alter table public.messages drop constraint messages_kind_check;
alter table public.messages drop constraint messages_payload_ck;

alter table public.messages
  add constraint messages_kind_check check (kind in ('text','image','file','location'));

-- The regex is evaluated before the casts, so ::numeric here cannot raise. The
-- range checks are the real guard: a location body is interpolated into a map URL
-- by the client, so a row that is not two plausible coordinates must never store.
alter table public.messages add constraint messages_payload_ck check (
  (kind = 'text' and attachment_path is null
     and body is not null and char_length(body) between 1 and 4000)
  or (kind = 'location' and attachment_path is null
     and body ~ '^-?\d{1,3}(\.\d{1,7})?,-?\d{1,3}(\.\d{1,7})?$'
     and abs(split_part(body, ',', 1)::numeric) <= 90
     and abs(split_part(body, ',', 2)::numeric) <= 180)
  or (kind in ('image','file') and attachment_path is not null)
);
