-- ============================================================
-- بيانات تجريبية — شغّلها بعد schema.sql في SQL Editor
-- ============================================================

-- 1) مناطق الشحن (كل المحافظات بسعر افتراضي 50ج)
insert into public.shipping_zones (governorate, delivery_fee, is_active)
values
  ('القاهرة', 50, true),
  ('الجيزة', 50, true),
  ('الإسكندرية', 60, true),
  ('القليوبية', 60, true),
  ('الشرقية', 65, true),
  ('الدقهلية', 65, true),
  ('الغربية', 65, true),
  ('المنوفية', 65, true),
  ('البحيرة', 70, true),
  ('كفر الشيخ', 70, true),
  ('دمياط', 70, true),
  ('بورسعيد', 70, true),
  ('الإسماعيلية', 70, true),
  ('السويس', 70, true),
  ('الفيوم', 75, true),
  ('بني سويف', 75, true),
  ('المنيا', 80, true),
  ('أسيوط', 80, true),
  ('سوهاج', 85, true),
  ('قنا', 85, true),
  ('الأقصر', 90, true),
  ('أسوان', 95, true),
  ('البحر الأحمر', 100, true),
  ('مطروح', 100, true),
  ('شمال سيناء', 100, true),
  ('جنوب سيناء', 100, true),
  ('الوادي الجديد', 110, true)
on conflict (governorate) do nothing;

-- 2) منتجات تجريبية
insert into public.products (slug, name, description, category, images, status, featured) values
  ('oud-royal', 'عود ملكي', E'عطر شرقي فخم يفتح بالعود الكمبودي والزعفران، وينتهي بلمسة عنبر دافئة تدوم طويلاً.\nمثالي للمناسبات والسهرات.', 'men', '["https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80","https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=800&q=80"]'::jsonb, 'published', true),
  ('rose-noir', 'روز نوار', E'باقة ورد جوري دمشقي مع لمسة فانيليا ومسك أبيض.\nعطر حريمي أنيق يناسب النهار والمساء.', 'women', '["https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&q=80","https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&q=80"]'::jsonb, 'published', true),
  ('amber-wood', 'عنبر وود', E'خشب الصندل مع العنبر والفانيليا — عطر للجنسين برواق دافئ يصلح لأي وقت.', 'unisex', '["https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=800&q=80"]'::jsonb, 'published', false),
  ('musk-white', 'مسك أبيض', E'نقاء المسك الأبيض مع أزهار البرتقال.\nعطر هادئ وراقي لكل يوم.', 'women', '["https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=800&q=80"]'::jsonb, 'published', false),
  ('leather-oud', 'ليذر عود', E'جلد فاخر مع عود وتبغ حلو — عطر رجالي جسور لصاحب شخصية قوية.', 'men', '["https://images.unsplash.com/photo-1590736969955-71cc94901144?w=800&q=80"]'::jsonb, 'published', false),
  ('citrus-breeze', 'سيتروس بريز', E'حمضيات منعشة مع نعناع وفيتيفر — عطر صيفي مشبع بالحيوية للجنسين.', 'unisex', '["https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=800&q=80"]'::jsonb, 'published', false)
on conflict (slug) do nothing;

-- 3) الأحجام والأسعار
insert into public.product_variants (product_id, sku, size_ml, price, stock, is_active)
select p.id, v.sku, v.size_ml, v.price, v.stock, true
from public.products p
join (values
  ('oud-royal',   'OUD-50',  50,  650, 15),
  ('oud-royal',   'OUD-100', 100, 950, 10),
  ('rose-noir',   'RSN-50',  50,  550, 20),
  ('rose-noir',   'RSN-100', 100, 800, 12),
  ('amber-wood',  'AMB-50',  50,  480, 18),
  ('amber-wood',  'AMB-100', 100, 720, 8),
  ('musk-white',  'MSK-50',  50,  420, 25),
  ('leather-oud', 'LTH-100', 100, 890, 6),
  ('citrus-breeze','CIT-50', 50,  380, 22),
  ('citrus-breeze','CIT-100',100, 560, 14)
) as v(slug, sku, size_ml, price, stock) on v.slug = p.slug
where not exists (
  select 1 from public.product_variants pv
  where pv.product_id = p.id and pv.size_ml = v.size_ml
);

-- 4) عرض تجريبي: خصم 20% على 100مل من "عود ملكي" (ساري لمدة شهر)
insert into public.offers (variant_id, discount_type, discount_value, start_at, end_at, is_active)
select pv.id, 'percentage', 20, now(), now() + interval '30 days', true
from public.product_variants pv
join public.products p on p.id = pv.product_id
where p.slug = 'oud-royal' and pv.size_ml = 100
  and not exists (select 1 from public.offers o where o.variant_id = pv.id);

-- 5) تقييمات تجريبية معتمدة
insert into public.reviews (product_id, customer_name, rating, comment, status, verified_purchase)
select p.id, r.name, r.rating, r.comment, 'approved', r.verified
from public.products p
join (values
  ('oud-royal', 'أحمد محمود', 5, 'ثبات رهيب وأرواق فخمة جدًا — يستاهل كل جنيه', true),
  ('oud-royal', 'كريم سامي', 4, 'عطر جميل جدًا بس الفوحان محتاج رشات زيادة', true),
  ('rose-noir', 'مريم عادل', 5, 'أجمل عطر جربته، الريحة بتفضل معايا اليوم كله', true),
  ('rose-noir', 'سارة حسن', 4, 'رائحة راقية وأنثوية، التغليف كمان فخم', false),
  ('amber-wood', 'محمود خالد', 5, 'دافي ومميز، بيصلح لكل الأوقات', true)
) as r(slug, name, rating, comment, verified) on r.slug = p.slug
where not exists (select 1 from public.reviews rv where rv.product_id = p.id);

-- ============================================================
-- تم ✅ — دلوقتي اعمل مستخدم أدمن من Authentication > Users
-- وبعدين أضف ID بتاعه في admin_users (شوف README خطوة بخطوة)
-- ============================================================
