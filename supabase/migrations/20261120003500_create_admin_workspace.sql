create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

comment on table public.admin_users is
  'Server-managed administrator allowlist. Membership is provisioned only through Supabase Auth and SQL.';

create table public.menu_items (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 100),
  description text not null check (char_length(description) between 3 and 300),
  price integer not null check (price between 1 and 1000000),
  category text not null
    check (category in ('Starters', 'Main Course', 'Chef Specials', 'Desserts', 'Beverages')),
  image_url text not null check (char_length(image_url) between 1 and 2048),
  image_storage_path text,
  image_alt text not null check (char_length(image_alt) between 3 and 240),
  ingredients text[] not null default '{}'
    check (cardinality(ingredients) <= 30),
  is_vegetarian boolean not null default false,
  is_bestseller boolean not null default false,
  is_chef_recommended boolean not null default false,
  is_featured boolean not null default false,
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index menu_items_public_order_idx
  on public.menu_items (is_available, sort_order, name);
create index menu_items_category_idx
  on public.menu_items (category, is_available, sort_order);

create table public.restaurant_settings (
  id text primary key default 'default' check (id = 'default'),
  restaurant_name text not null check (char_length(restaurant_name) between 2 and 100),
  address text not null check (char_length(address) between 2 and 300),
  phone text not null check (char_length(phone) between 7 and 30),
  email text not null check (char_length(email) between 3 and 254),
  opening_hours text not null check (char_length(opening_hours) between 3 and 500),
  time_zone text not null default 'America/New_York',
  currency text not null default 'INR' check (currency = 'INR'),
  updated_at timestamptz not null default now()
);

create function public.set_admin_workspace_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger menu_items_updated_at
before update on public.menu_items
for each row execute function public.set_admin_workspace_updated_at();

create trigger restaurant_settings_updated_at
before update on public.restaurant_settings
for each row execute function public.set_admin_workspace_updated_at();

create function public.admin_reservation_activity(p_from date, p_to date)
returns table (
  reservation_date date,
  reservation_count bigint,
  pending_count bigint,
  confirmed_count bigint,
  rejected_count bigint,
  cancelled_count bigint
)
language sql
stable
set search_path = ''
as $$
  select
    r.reservation_date,
    count(*) as reservation_count,
    count(*) filter (where r.status = 'pending') as pending_count,
    count(*) filter (where r.status = 'confirmed') as confirmed_count,
    count(*) filter (where r.status = 'rejected') as rejected_count,
    count(*) filter (where r.status = 'cancelled') as cancelled_count
  from public.reservations as r
  where r.reservation_date between p_from and p_to
  group by r.reservation_date
  order by r.reservation_date;
$$;

revoke all on function public.admin_reservation_activity(date, date)
  from public, anon, authenticated;
grant execute on function public.admin_reservation_activity(date, date)
  to service_role;

create function public.admin_search_contact_messages(
  p_search text,
  p_status text,
  p_page integer,
  p_page_size integer
)
returns table (
  id uuid,
  customer_name text,
  customer_email text,
  customer_phone text,
  subject text,
  message text,
  status text,
  created_at timestamptz,
  total_count bigint
)
language sql
stable
set search_path = ''
as $$
  with escaped_term as (
    select replace(
      replace(
        replace(p_search, E'\\', E'\\\\'),
        '%', E'\\%'
      ),
      '_', E'\\_'
    ) as value
  ),
  filtered as (
    select
      m.id,
      m.customer_name,
      m.customer_email,
      m.customer_phone,
      m.subject,
      m.message,
      m.status,
      m.created_at,
      count(*) over () as total_count
    from public.contact_messages as m
    cross join escaped_term as term
    where (p_status = 'all' or m.status = p_status)
      and (
        p_search = ''
        or m.customer_name ilike '%' || term.value || '%' escape E'\\'
        or m.customer_email ilike '%' || term.value || '%' escape E'\\'
        or m.subject ilike '%' || term.value || '%' escape E'\\'
        or m.message ilike '%' || term.value || '%' escape E'\\'
      )
  )
  select *
  from filtered
  order by created_at desc
  limit least(greatest(p_page_size, 1), 100)
  offset (greatest(p_page, 1) - 1) * least(greatest(p_page_size, 1), 100);
$$;

revoke all on function public.admin_search_contact_messages(text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.admin_search_contact_messages(text, text, integer, integer)
  to service_role;

alter table public.admin_users enable row level security;
alter table public.menu_items enable row level security;
alter table public.restaurant_settings enable row level security;
revoke all on table public.admin_users, public.menu_items, public.restaurant_settings
  from public, anon, authenticated;
grant all on table public.admin_users, public.menu_items, public.restaurant_settings
  to service_role;

insert into public.restaurant_settings
  (id, restaurant_name, address, phone, email, opening_hours, time_zone, currency)
values
  ('default', 'LuxeBite', 'Fictional demo location — replace before launch',
   '(212) 555-0148', 'hello@luxebite.com',
   'Tuesday–Sunday, 5:00 pm–10:30 pm; Monday closed',
   'America/New_York', 'INR');

insert into public.menu_items
  (id, name, description, price, category, image_url, image_alt, ingredients,
   is_vegetarian, is_bestseller, is_chef_recommended, is_featured, sort_order)
values
  ('heirloom-tomatoes', 'Heirloom & Burrata',
   'Summer tomatoes, hand-pulled burrata, basil oil', 820, 'Starters',
   '/images/heirloom-salad.webp',
   'A colorful seasonal salad finished with fresh herbs',
   array['Heirloom tomatoes', 'Burrata', 'Basil oil', 'Sourdough'],
   true, true, false, true, 10),
  ('roasted-pumpkin-veloute', 'Roasted Pumpkin Velouté',
   'Crisp sage, cultured cream, toasted pepitas', 560, 'Starters',
   '/images/roasted-pumpkin.webp',
   'A warm, velvety seasonal soup garnished with herbs',
   array['Roasted pumpkin', 'Cultured cream', 'Sage', 'Pepitas'],
   true, false, false, false, 20),
  ('citrus-garden', 'Citrus & Fennel',
   'Pink grapefruit, shaved fennel, whipped ricotta', 680, 'Starters',
   '/images/citrus-garden.webp',
   'A fresh garden salad with citrus and crisp greens',
   array['Pink grapefruit', 'Fennel', 'Whipped ricotta', 'Mint'],
   true, false, false, false, 30),
  ('dayboat-scallops', 'Dayboat Scallops',
   'Cauliflower silk, brown butter, garden herbs', 1490, 'Main Course',
   '/images/dayboat-scallops.webp',
   'A carefully plated signature restaurant dish',
   array['Dayboat scallops', 'Cauliflower', 'Brown butter', 'Chives'],
   false, true, true, true, 40),
  ('wild-mushroom-risotto', 'Wild Mushroom Risotto',
   'Porcini, aged parmesan, a little truffle', 980, 'Main Course',
   '/images/wild-mushroom-risotto.webp',
   'A rich bowl of pasta finished with herbs and parmesan',
   array['Porcini', 'Arborio rice', 'Aged parmesan', 'Truffle'],
   true, false, false, false, 50),
  ('slow-braised-short-rib', 'Slow-Braised Short Rib',
   'Red wine jus, pomme purée, glazed shallots', 1690, 'Main Course',
   '/images/slow-braised-short-rib.webp',
   'A slow-braised beef course served with seasonal sides',
   array['Braised short rib', 'Red wine', 'Potato', 'Shallots'],
   false, false, false, false, 60),
  ('herb-crusted-lamb', 'Herb-Crusted Lamb Rack',
   'Rosemary crumb, smoked aubergine, lamb jus', 1890, 'Chef Specials',
   '/images/herb-crusted-lamb.webp',
   'A chef''s lamb special served with charred seasonal vegetables',
   array['Lamb rack', 'Rosemary', 'Aubergine', 'Lamb jus'],
   false, true, true, false, 70),
  ('garden-tasting-plate', 'The Garden Tasting Plate',
   'Market vegetables, whipped tahini, toasted seeds', 1360, 'Chef Specials',
   '/images/chefs-garden-plate.webp',
   'A colorful plant-forward tasting plate with seasonal produce',
   array['Market vegetables', 'Whipped tahini', 'Seeds', 'Herbs'],
   true, false, true, false, 80),
  ('midnight-chocolate', 'Midnight Chocolate',
   'Valrhona crémeux, salted caramel, cacao nib', 680, 'Desserts',
   '/images/midnight-chocolate.webp',
   'Rich chocolate cake with an elegant finish',
   array['Dark chocolate', 'Salted caramel', 'Cacao nib', 'Cream'],
   true, false, false, true, 90),
  ('vanilla-panna-cotta', 'Vanilla Bean Panna Cotta',
   'Madagascar vanilla, macerated berries, almond tuile', 520, 'Desserts',
   '/images/vanilla-panna-cotta.webp',
   'A delicate vanilla dessert served with seasonal berries',
   array['Madagascar vanilla', 'Cream', 'Seasonal berries', 'Almond'],
   true, false, false, false, 100),
  ('rosemary-citrus-spritz', 'Rosemary Citrus Spritz',
   'Blood orange, rosemary, sparkling water', 420, 'Beverages',
   '/images/rosemary-citrus-spritz.webp',
   'A bright citrus drink garnished with fresh herbs',
   array['Blood orange', 'Rosemary', 'Sparkling water', 'Lime'],
   true, false, false, false, 110),
  ('espresso-martini', 'Espresso Martini',
   'House espresso, vanilla, a velvet-soft finish', 620, 'Beverages',
   '/images/espresso-martini.webp',
   'A dark cocktail served in a chilled coupe glass',
   array['House espresso', 'Vodka', 'Coffee liqueur', 'Vanilla'],
   true, false, false, false, 120);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-images',
  'menu-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy menu_images_public_read
on storage.objects for select
using (bucket_id = 'menu-images');
