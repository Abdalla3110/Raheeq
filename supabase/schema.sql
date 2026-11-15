-- ============================================================
-- مِسك للعطور — Supabase Schema
-- شغّل الملف ده كامل في: Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- 1) الجداول ──────────────────────────────────────────────────

-- المنتجات
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  category text not null check (category in ('men','women','unisex')),
  images jsonb not null default '[]'::jsonb,
  meta_title text,
  meta_description text,
  status text not null default 'published' check (status in ('draft','published','archived')),
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- أحجام المنتجات
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null,
  size_ml int not null check (size_ml > 0),
  price numeric(10,2) not null check (price >= 0),
  stock int not null default 0 check (stock >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, size_ml)
);

-- العروض (على مستوى الحجم)
create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  discount_type text not null check (discount_type in ('percentage','fixed')),
  discount_value numeric(10,2) not null check (discount_value >= 0),
  start_at timestamptz,
  end_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- التقييمات
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  customer_name text not null,
  rating int not null check (rating between 1 and 5),
  comment text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  verified_purchase boolean not null default false,
  created_at timestamptz not null default now()
);

-- مناطق الشحن
create table if not exists public.shipping_zones (
  id uuid primary key default gen_random_uuid(),
  governorate text unique not null,
  delivery_fee numeric(10,2) not null check (delivery_fee >= 0),
  is_active boolean not null default true
);

-- الأوردرات
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint not null unique,
  customer_name text not null,
  phone text not null,
  governorate text not null,
  city text not null,
  address text not null,
  notes text,
  subtotal numeric(12,2) not null,
  discount_total numeric(12,2) not null default 0,
  shipping_fee numeric(12,2) not null default 0,
  total numeric(12,2) not null,
  status text not null default 'NEW' check (status in ('NEW','CONFIRMED','PREPARING','SHIPPED','DELIVERED','CANCELLED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- عناصر الأوردر (snapshot كامل)
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid,
  variant_id uuid,
  product_name text not null,
  variant_size_ml int not null,
  variant_sku text not null,
  unit_price numeric(10,2) not null,
  discount_amount numeric(10,2) not null default 0,
  final_price numeric(10,2) not null,
  quantity int not null check (quantity > 0)
);

-- سجل حالات الأوردر
create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status text not null,
  note text,
  created_at timestamptz not null default now()
);

-- مستخدمي الأدمن
create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);

-- جدول rate limiting للتقييمات وطلبات API الأخرى
create table if not exists public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  identifier text not null, -- IP address أو user_id
  action_type text not null, -- مثال: 'review_submit', 'login_attempt'
  count int not null default 1,
  expires_at timestamptz not null default (now() + interval '1 hour'),
  created_at timestamptz not null default now(),
  unique (identifier, action_type)
);

-- index لتحسين الأداء
create index if not exists rate_limits_identifier_idx on public.rate_limits(identifier, action_type);
create index if not exists rate_limits_expires_idx on public.rate_limits(expires_at);

-- منع HTML في أسماء وتعليقات التقييمات (حماية إضافية)
alter table public.reviews enable row level security;

-- RLS لجدول rate_limits
alter table public.rate_limits enable row level security;

-- دالة للتحقق من rate limit (نسخة مبسطة)
create or replace function public.check_rate_limit(p_identifier text, p_action_type text, p_max_count int default 3, p_window_minutes int default 60)
returns table (allowed boolean, remaining int, reset_at timestamptz)
language plpgsql
security definer
as $$
declare
  current_count int;
  window_end timestamptz;
  window_start timestamptz;
begin
  window_start := now() - (p_window_minutes || ' minutes')::interval;
  window_end := now() + (p_window_minutes || ' minutes')::interval;

  -- حذف السجلات المنتهية
  delete from public.rate_limits
  where expires_at < now();

  -- جلب العدد الحالي في النافذة
  select coalesce(sum(count), 0) into current_count
  from public.rate_limits
  where identifier = p_identifier
    and action_type = p_action_type
    and created_at >= window_start;

  -- إذا كان العدد أقل من الحد الأقصى، نسمح
  if current_count < p_max_count then
    -- إدخال سجل جديد لكل طلب (بسيط ولكنه فعال)
    insert into public.rate_limits (identifier, action_type, count, expires_at)
    values (p_identifier, p_action_type, 1, window_end);

    return query select
      true as allowed,
      p_max_count - current_count - 1 as remaining,
      window_end as reset_at;
  else
    return query select
      false as allowed,
      0 as remaining,
      window_end as reset_at;
  end if;
end;
$$;

-- RLS policies لجدول rate_limits
create policy "rate_limits_public_insert" on public.rate_limits
  for insert with check (true);

create policy "rate_limits_admin_read" on public.rate_limits
  for select using (public.is_admin());

create policy "rate_limits_admin_delete" on public.rate_limits
  for delete using (public.is_admin());

-- 2) دوال مساعدة ─────────────────────────────────────────────

-- رقم أوردر تسلسلي ذري
create or replace function public.next_order_number()
returns bigint
language plpgsql
as $$
declare
  seq bigint;
begin
  -- نجيب آخر رقم ونزيده — الذرية مضمونة بالـ unique constraint
  select coalesce(max(order_number), 1000) + 1 into seq from public.orders;
  return seq;
end;
$$;

-- خصم الستوك بشكل ذري داخل transaction واحدة
-- p_items: jsonb array من { variant_id, quantity }
create or replace function public.decrease_stock(p_items jsonb)
returns void
language plpgsql
security definer
as $$
begin
  with payload as (
    select
      (elem->>'variant_id')::uuid as variant_id,
      (elem->>'quantity')::int as qty
    from jsonb_array_elements(p_items) as elem
  )
  update public.product_variants v
  set stock = v.stock - payload.qty,
      updated_at = now()
  from payload
  where v.id = payload.variant_id
    and v.stock >= payload.qty;

  -- لو أي صف ما اتخصمش (ستوك مش كفاية) نرمي خطأ
  if exists (
    select 1
    from jsonb_array_elements(p_items) as elem
    where (select stock from public.product_variants
           where id = (elem->>'variant_id')::uuid) < (elem->>'quantity')::int
  ) then
    raise exception 'INSUFFICIENT_STOCK';
  end if;
end;
$$;

-- تحديث updated_at تلقائيًا
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products
for each row execute function public.touch_updated_at();

drop trigger if exists variants_touch on public.product_variants;
create trigger variants_touch before update on public.product_variants
for each row execute function public.touch_updated_at();

drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
for each row execute function public.touch_updated_at();

-- 3) Row Level Security ──────────────────────────────────────

alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.offers enable row level security;
alter table public.shipping_zones enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.admin_users enable row level security;

-- دالة مساعدة: هل المستخدم الحالي أدمن؟
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.admin_users
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ── المنتجات: قراءة عامة للمنشور فقط، كتابة للأدمن ──
create policy "products_public_read" on public.products
  for select using (status = 'published' or public.is_admin());

create policy "products_admin_write" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- ── الأحجام: قراءة عامة (عن طريق منتج منشور — تبسيطًا نسمح بالقراءة العامة) ──
create policy "variants_public_read" on public.product_variants
  for select using (is_active or public.is_admin());

create policy "variants_admin_write" on public.product_variants
  for all using (public.is_admin()) with check (public.is_admin());

-- ── العروض: قراءة عامة (التحقق من التواريخ في الكود بدلاً من SQL) ──
drop policy if exists "offers_public_read" on public.offers;
create policy "offers_public_read" on public.offers
  for select using (true);

drop policy if exists "offers_admin_write" on public.offers;
create policy "offers_admin_write" on public.offers
  for all using (public.is_admin()) with check (public.is_admin());

-- ── الشحن: قراءة عامة، كتابة للأدمن ──
create policy "shipping_public_read" on public.shipping_zones
  for select using (true);

create policy "shipping_admin_write" on public.shipping_zones
  for all using (public.is_admin()) with check (public.is_admin());

-- ── التقييمات: قراءة العامة للمعتمدة، أي حد يقدر يضيف pending، الأدمن يعتمد ──
create policy "reviews_public_read" on public.reviews
  for select using (status = 'approved' or public.is_admin());

create policy "reviews_public_insert" on public.reviews
  for insert with check (
    status = 'pending'
    and char_length(customer_name) between 2 and 60
    and char_length(coalesce(comment, '')) <= 500
  );

create policy "reviews_admin_update" on public.reviews
  for update using (public.is_admin()) with check (public.is_admin());

create policy "reviews_admin_delete" on public.reviews
  for delete using (public.is_admin());

-- ── الأوردرات: للأدمن فقط (الإنشاء عبر service role من السيرفر) ──
create policy "orders_admin_all" on public.orders
  for all using (public.is_admin()) with check (public.is_admin());

create policy "order_items_admin_all" on public.order_items
  for all using (public.is_admin()) with check (public.is_admin());

create policy "history_admin_all" on public.order_status_history
  for all using (public.is_admin()) with check (public.is_admin());

-- ── admin_users: الأدمن يشوف النظائر، مستخدم عادي يشوف نفسه بس ──
create policy "admin_read_own" on public.admin_users
  for select using (id = auth.uid() or public.is_admin());

-- REMOVED (security): anyone could self-register as admin. Create first admin via SQL editor per README.
-- create policy "admin_insert_first" on public.admin_users -- مطلوب مرة واحدة لتسجيل أول أدمن (شوف README)

create policy "admin_manage" on public.admin_users
  for all using (public.is_admin()) with check (public.is_admin());

-- 4) Storage bucket للصور ────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- رفع الصور من لوحة الأدمن فقط، والقراءة عامة
create policy "storage_read_public" on storage.objects
  for select using (bucket_id = 'product-images');

create policy "storage_admin_upload" on storage.objects
  for insert with check (
    bucket_id = 'product-images'
    and public.is_admin()
  );

create policy "storage_admin_delete" on storage.objects
  for delete using (
    bucket_id = 'product-images'
    and public.is_admin()
  );

-- ============================================================
-- تم ✅ — بعد كده شغّل seed.sql واتبع README
-- ============================================================
