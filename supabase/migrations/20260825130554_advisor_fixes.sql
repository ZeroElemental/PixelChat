create or replace function private.uuid_or_null(t text)
returns uuid language plpgsql immutable set search_path = '' as $$
begin return t::uuid; exception when others then return null; end;
$$;

drop function if exists private.touch_conversation();
