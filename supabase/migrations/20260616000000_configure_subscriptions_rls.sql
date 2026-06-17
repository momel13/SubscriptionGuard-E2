-- Issue #85: keep RLS enabled for subscriptions and allow authenticated
-- users to create/read only their own subscription rows.

alter table public.subscriptions enable row level security;

grant select, insert on table public.subscriptions to authenticated;

do $$
begin
  if to_regclass('public.subscriptions_id_seq') is not null then
    grant usage, select on sequence public.subscriptions_id_seq to authenticated;
  end if;
end $$;

create index if not exists subscriptions_user_id_idx
on public.subscriptions (user_id);

drop policy if exists "subscriptions_select_own_rows" on public.subscriptions;
create policy "subscriptions_select_own_rows"
on public.subscriptions
for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "subscriptions_insert_own_rows" on public.subscriptions;
create policy "subscriptions_insert_own_rows"
on public.subscriptions
for insert
to authenticated
with check (user_id = (select auth.uid()));
