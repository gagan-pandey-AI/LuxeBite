create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  booking_reference text not null unique
    check (booking_reference ~ '^LB-[0-9]{6}-[A-F0-9]{16}$'),
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
  reservation_date date not null
    check (extract(isodow from reservation_date) between 2 and 7),
  reservation_time time without time zone not null
    check (
      reservation_time between time '17:00' and time '22:00'
      and extract(minute from reservation_time)::integer in (0, 30)
    ),
  guest_count integer not null check (guest_count between 1 and 8),
  special_requests text
    check (special_requests is null or char_length(special_requests) <= 1000),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'rejected', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.reservations is
  'Private customer reservation requests. New requests are pending until staff confirmation.';
comment on column public.reservations.reservation_date is
  'Calendar date in the restaurant local timezone (America/New_York).';
comment on column public.reservations.reservation_time is
  'Local restaurant time in America/New_York.';

create index reservations_date_time_idx
  on public.reservations (reservation_date, reservation_time);
create index reservations_status_created_idx
  on public.reservations (status, created_at desc);

create function public.set_reservations_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger reservations_updated_at
before update on public.reservations
for each row execute function public.set_reservations_updated_at();

alter table public.reservations enable row level security;
revoke all on table public.reservations from public, anon, authenticated;
grant all on table public.reservations to service_role;
