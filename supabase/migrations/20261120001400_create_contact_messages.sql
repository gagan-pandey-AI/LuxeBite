create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null
    check (char_length(customer_name) between 2 and 100),
  customer_email text not null
    check (
      char_length(customer_email) <= 254
      and customer_email = lower(customer_email)
    ),
  customer_phone text not null
    check (
      customer_phone ~ '^[+0-9(). -]{1,30}$'
      and char_length(regexp_replace(customer_phone, '[^0-9]', '', 'g'))
        between 7 and 20
    ),
  subject text not null check (char_length(subject) between 3 and 120),
  message text not null check (char_length(message) between 10 and 3000),
  status text not null default 'new'
    check (status in ('new', 'read', 'replied', 'archived')),
  created_at timestamptz not null default now()
);

comment on table public.contact_messages is
  'Private customer messages submitted through the LuxeBite concept contact form.';

create index contact_messages_created_at_idx
  on public.contact_messages (created_at desc);
create index contact_messages_status_created_at_idx
  on public.contact_messages (status, created_at desc);

alter table public.contact_messages enable row level security;
revoke all on table public.contact_messages from public, anon, authenticated;
grant all on table public.contact_messages to service_role;
