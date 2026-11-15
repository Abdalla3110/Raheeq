# 🔍 تقرير مراجعة الكود والـ Business Logic — مِسك للعطور

> مراجعة شاملة لكل ملفات المشروع (45 ملف) + سكيما Supabase.
> النتيجة العامة: **الكود منظم وجيد كأساس MVP**، لكن فيه **أخطاء حرجة في الأمان والـ Business Logic** لازم تتصلح قبل النشر.
> الـ TypeScript typecheck (`tsc --noEmit`) بيمر بدون أخطاء — المشاكل كلها منطقية/أمنية.

---

## 🔴 أخطاء حرجة (Critical — لازم تتصلح قبل النشر)

### 1) ثغرة أمنية: أي زائر يقدر يعمل نفسه أدمن
**الملف:** `supabase/schema.sql`

السياسة دي بتيح لأي حد (anon) يضيف نفسه في `admin_users`:
```sql
create policy "admin_insert_first" on public.admin_users
  for insert with check (true); -- مطلوب مرة واحدة لتسجيل أول أدمن
```
أي شخص عنده anon key يقدر يعمل insert بـ `id` بتاعه → يبقى أدمن كامل على كل الجداول (المنتجات، الأوردرات، بيانات العملاء).

**الحل:** امسح السياسة دي بعد إنشاء أول أدمن، أو الأفضل: اعمل أول أدمن من الـ Dashboard مباشرة (SQL Editor بـ service role) وسياسة الـ insert تكون للأدمن فقط.

### 2) رقم الأوردر فيه احتمالية تصادم عالية (بيكسر إنشاء الأوردر)
**الملف:** `src/app/api/orders/route.ts` (خطوة 4)

```ts
const orderNumber = parseInt(`${timestamp}${uuidPart}`, 10) % 1000000000;
```
- بيدمج 13 رقم (timestamp) مع 8 hex chars → الرقم الناتج `parseInt` بيتحول لـ float وبيضيع دقته بعد 15 رقم (2^53).
- عملية الـ modulo على رقم ضخم بتقلل الفراغ لـ 999,999,999 احتمال — مع `unique` constraint في الداتابيز، أول تصادم هيخلي إنشاء الأوردر يفشل بـ 500.
- التصادم وارد جدًا مع أول ألف أوردر (birthday paradox).

**الحل الأصلي (الموجود في السكيما كميت):** استخدم دالة `next_order_number()` الموجودة فعلاً في `schema.sql` لكن غير مستخدمة، أو sequence:
```sql
create sequence order_number_seq start 1000;
-- وفي الكود: order_number = order_number_seq.nextval
```

### 3) تسريب بيانات خصوصية: سجل حالة الأوردر متاح للجميع عبر RLS
**الملف:** `supabase/schema.sql`

```sql
create policy "history_admin_all" on public.order_status_history
  for all using (public.is_admin()) with check (public.is_admin());
```
المشكلة إن مفيش policy للـ `anon` — لكن `fix_grants2.sql` بيدي `grant select` لكل الجداول، ومع إن RLS بيحجب الصفوف، السياسة الوحيدة هي للأدمن. المشكلة الحقيقية: **policy `orders_admin_all` هي `for all` مع `using` و `check` — لكن لما الأدمن يعرض الأوردر مع `order_items` عبر select nested، الـ anon مش هيقدر يقرا الأوردرات نهائيًا** — ده صح ✅. لكن فيه تعارض: لو في مستقبل الـ customer بيحتاج يشوف أوردراته، لازم تضيف policies مخصوصة.

**الأهم:** `fix_grants2.sql` بيدي `insert, update, delete` لكل الجداول لـ `authenticated` — يعني **أي مستخدم authenticated** (حتى غير الأدمن) لو RLS اتخطت لأي سبب، هيقدر يعدّل. ده مسموح لأن RLS هو خط الدفاع، لكن مزج grants واسعة مع RLS مخاطرة يفضل تقللها.

### 4) `decrease_stock` مش آمن ضد الحالات المتزامنة (Race condition)
**الملف:** `supabase/schema.sql` — دالة `decrease_stock`

```sql
update public.product_variants v
set stock = v.stock - payload.qty
from payload
where v.id = payload.variant_id and v.stock >= payload.qty;

if exists (... stock < qty ...) then raise exception;
```
- الـ update بيمشي على الصفوف اللي ستوكها كفاية فقط، وبتسيب الباقي — ده طبيعي.
- لكن لو طلبين وصلوا مع بعض لنفس الصف، الـ `update` بيقفل الصف لحد أول transaction تخلص — **السلوك ده سليم**. لكن المشكلة الحقيقية: **لو الـ exception اترمي، الـ update اللي حصل قبل كده في نفس الـ transaction بيتعمله rollback تلقائي** ✅.
- **الخطأ الفعلي:** الدالة بتشتغل من service role، يعني لو API مرر `p_items` غلط أو اتضرب بـ concurrent requests، مفيش `select ... for update` صريح — Postgres بيقفل الصف في الـ UPDATE نفسه، فده آمن عمليًا. لكن فيه مشكلة تانية أدق: لو نفس variant اتكرر مرتين في `p_items` (نفس variant_id في سطرين)، الـ update هينقص الستوك مرة واحدة بس (بآخر قيمة)، بينما الـ check بعد كده هيقارن على آخر قيمة — **ممكن يخصم أقل من المطلوب**.

**الحل:** اجمع الكميات قبل الـ update:
```sql
with payload as (
  select (elem->>'variant_id')::uuid as variant_id,
         sum((elem->>'quantity')::int) as qty
  from jsonb_array_elements(p_items) elem
  group by 1
)
```
(وفي الكود أضف check يمنع تكرار variant_id في نفس الطلب).

### 5) لا يوجد تحقق أن `phone` في السلة مطابق — لحد ده عادي، لكن الـ rate limiting في الذاكرة مكسور
**الملف:** `src/app/api/reviews/route.ts`

```ts
const rateMap = new Map<string, { count: number; resetAt: number }>();
```
- Rate limit في الذاكرة **بيضيع مع كل restart**، ومش بيشتغل نهائيًا على serverless (Vercel) لأن كل lambda عندها ذاكرتها.
- النتيجة: مفيش rate limit حقيقي → سبام تقييمات ممكن يملى الداتابيز.
- في نفس الوقت جدول `rate_limits` + دالة `check_rate_limit` موجودين في السكيما لكن **غير مستخدمين في الكود إطلاقًا** — كود ميت.

**الحل:** استخدم دالة `check_rate_limit` في الداتابيز بدل الـ Map، أو Upstash Redis.

### 6) دالة `next_order_number()` ليست ذرية (مذكورة كـ"ذرية" في التعليق لكنها كذب)
**الملف:** `supabase/schema.sql`
```sql
select coalesce(max(order_number), 1000) + 1 into seq from public.orders;
```
مفيش قفل — طلبين متزامنين هيقرؤا نفس الرقم، واحد فيهم هيفشل بالـ unique constraint. (غير مستخدمة حاليًا — لكن لو حد رجع ليها هتكون مصدر bugs).

### 7) الحذف في لوحة الأدمن مش بيمسح الصور من Storage
**الملف:** `src/app/admin/products/page.tsx` — `handleDelete`

- بيحذف العروض والأحجام والمنتج من الداتابيز، لكن الصور في `product-images` bucket بتفضل — تراكم ملفات يزود تكلفة Storage.
- كمان لو المستخدم شال صورة من الفورم، الصورة القديمة بتضل في الـ bucket.

**الحل:** قبل الحذف، اعمل loop على `deleting.images` واستدعي `supabase.storage.from('product-images').remove([...])`.

---

## 🟠 أخطاء متوسطة (High — تصلح قريب)

### 8) السلة مش بتتحقق من الأسعار/الستوك قبل الـ checkout (تجربة مستخدم سيئة)
**الملف:** `src/app/checkout/page.tsx`

- المستخدم بيفتح صفحة الـ checkout بأسعار قديمة (من localStorage). الـ API بيرفض الطلب برسالة عامة "أحد المنتجات لم يعد متاحًا — حدّث السلة" **من غير ما يقول إيه المنتج المعني بالظبط** (رسالة الستوك بتقول، لكن رسالة 409 الأولى عامة).
- والسلة مش بتتحدث نفسها من السيرفر لو الأسعار اتغيرت — العميل ممكن يشوف سعر قديم لحد ما يدوس تأكيد.

**الحل:** endpoint خفيف `POST /api/cart-validate` يرجع الأسعار الحالية + الستوك، وتستدعيه في صفحات السلة والـ checkout.

### 9) صفحة الأوردر الناجح بتقبل أي رقم من الـ URL
**الملف:** `src/app/order-success/page.tsx`

بيقرا `order` من الـ query ويروّق بيه من غير أي تحقق — ممكن حد يبعت رابط بـ رقم أوردر حقيقي لعميل تاني (spam/تصيد). مش تسريب فعلي لأن مفيش بيانات بتتعرض، لكن الأفضل توليد token قصير أو التحقق من وجود الرقم فعلاً.

### 10) الرسائل بالعربي فقط في الـ API
**الملف:** `src/app/api/orders/route.ts`, `src/app/api/reviews/route.ts`

كل رسايل الخطأ عربية ("بيانات الطلب غير صحيحة...") — المستخدم الإنجليزي هيشوف رسائل عربية. أضف `Accept-Language` أو ارجع error code والواجهة تترجم.

### 11) مشكلة تنسيق بيانات البحث: `ilike` على Arabic مع `%` — النتايج مش مضمونة
**الملف:** `src/components/ProductsGrid.tsx`, `src/app/products/ProductsClient.tsx`

- البحث بـ `ilike('%كلمة%')` شغال، لكن **مش بيدور في الوصف** ولا في الاسم بالإنجليزي لو المنتج مكتوب عربي والعكس.
- الأهم: لو المستخدم دخل `q` من الـ URL (من الهيدر) — `ProductsClient` بيقراه مرة واحدة في `useState` لكن لو المستخدم بحث تاني من الهيدر وهو في نفس الصفحة، الـ `useSearchParams` هيتغير لكن `useState` مش هيتحدث — **البحث الجديد مش هيشتغل**.

**الحل:** استخدم `useEffect` لتحديث `search` عند تغير `searchParams`، أو خلي `search` مباشر من `searchParams` بدون state.

### 12) لوحة الأدمن: عرض آخر 200 أوردر فقط
**الملف:** `src/app/admin/orders/page.tsx` — `.limit(200)`

- مفيش pagination — بعد 200 أوردر الأقدم يختفي بصمت من لوحة التحكم. نفس المشكلة في التقييمات.
- الأدمن مش هيلاحظ، وده ممكن يبقى مشكلة تشغيلية حقيقية.

**الحل:** pagination بسيط أو at least "load more" + عداد إجمالي.

### 13) التقييم "verified_purchase" معرف في السكيما لكن مفيش كود بيملاه
**الملف:** `supabase/schema.sql`, `seed.sql`

- `verified_purchase` بيتظبط من الـ seed بس. أي تقييم حقيقي هيسيبها `false` دايمًا.
- إما تشيلها من الـ UI، أو تحسبها بعد اعتماد التقييم بمطابقة `phone` في الأوردرات (محتاج ربط).

### 14) `formatEGP` بيقرب لأقرب جنيه ويضيع القروش
**الملف:** `src/lib/pricing.ts`

`maximumFractionDigits: 0` — لو في قروش (50.5ج) هتعرض "51" والاجماليات هتختلف عن الداتابيز. مقبول لو كل الأسعار أعداد صحيحة، لكن السكيما بتعرف `numeric(10,2)` — **لازم تقرر**: يا كل الأسعار int في السكيما، يا العرض يظهر كسور.

---

## 🟡 أخطاء منخفضة (Medium/Low — تحسينات)

### 15) `getRangeDates` بتستخدم `toISOString` (UTC) — التقويم المصري بيتأخر/يتقدم يوم
**الملف:** `src/app/admin/page.tsx`

`d.toISOString().slice(0, 10)` بياخد تاريخ UTC — "اليوم" في القاهرة بعد 2ص (UTC+3 في الصيف) بيحسب يوم غلط. استخدم `Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo' })`.

### 16) الرسم البياني `أوردرات` و `إيراد` في نفس المحور
**الملف:** `src/app/admin/page.tsx` — `BarChart`

الإيراد بالجنيه (آلاف) وأوردرات (وحدات) على نفس المحور Y — عمود الأوردرات مش هيبان. في الكود عمود `إيراد` معرف لكن مش مرسوم (بيترسم `أوردرات` بس) — **بيانات ميتة**. إما رسم `إيراد` على محور تاني، أو امسحه.

### 17) السلة `maxStock` بيتجمد وقت الإضافة
**الملف:** `src/lib/store.tsx`

لو ستوك قل بعد إضافة المنتج، `updateQuantity` بيسمح بالقيمة المحفوظة القديمة (مثلاً 10) حتى لو الستوك الحقيقي 2 — الـ API هيرفض وقتها. (مرتبط بالنقطة 8).

### 18) `decrease_stock` بياخد كل الحقول زيادة عن اللزوم
**الملف:** `src/app/api/orders/route.ts` — `itemsToInsert`

بيتمرر كامل صف `order_items` (فيه product_name, sku...) لدالة `decrease_stock` اللي بتستخدم `variant_id` و `quantity` بس — شغال، لكن تمرير JSON ضخم من غير داعي. تمرير مصفوفة مصغرة أنضف وأسرع.

### 19) الصور بتتحمل بدون `next/image`
كل `<img>` بـ eslint-disable — مقبول للـ MVP لكن الصور الحقيقية (500KB+) هتبطّئ الموقع. لما تنقل لصور حقيقية، استخدم `next/image` مع remotePatterns.

### 20) `SUPABASE_SERVICE_ROLE_KEY` غير موجودة = الـ sitemap والأوردرات بيكسروا
`createAdminClient` بي رمي exception لو المفتاح مش موجود — الـ sitemap بيعمل catch ويرجع static فقط ✅، لكن `/api/orders` هيرجع 500 لكل الزوار والـ checkout هيبقى مش لوظ نهائيًا. أضف فحص startup أو رسالة أوضح.

### 21) Middleware بيتخطى `/admin/login` صح، لكن مش بيتحقق من `admin_users`
**الملف:** `src/middleware.ts` + `src/app/admin/layout.tsx`

الـ middleware بيكفي للـ redirect، والـ layout بيعمل التحقق من الدور. ده تصميم سليم، لكن `AdminShell` بيلف كل صفحات الأدمن — وصفحة `/admin/login` بتشتغل تحت نفس الـ layout! (لو المستخدم مسجل ومحاولة `/admin/login` → هتفتح صفحة login جوه الشل). جرّب `pathname === '/admin/login'` يعمل redirect لـ `/admin`.

### 22) الهيدر مش بيقفل الموبايل منيو عند تغيير الصفحة
**الملف:** `src/components/Header.tsx`

الـ nav items في الـ drawer فيها `onClick={() => setMenuOpen(false)}` ✅ — تمام. لكن روابط `/admin` في الفوتر/الهيدر مش موجودة (مقصود)، وصفحة login مش محمية من الفهرسة — أضف `robots: { index: false }` metadata لصفحة login.

### 23) مشكلة عدم تطابق الـ phone في wa.me
**الملف:** `src/app/admin/orders/page.tsx` — `waLink`

`https://wa.me/2${phone}` — بيضيف كود مصر (20) كـ "2" — **ده غلط**. المفروض `20` مش `2`:
- `wa.me/201012345678` ✅
- `wa.me/21012345678` ❌ (رقم غلط)
الرابط الحالي هيبعت للرقم الغلط أو يفشل.

### 24) حقول `governorate` في orders مش مقيدة
الـ API بيعمل lookup في `shipping_zones` — لو المحافظة مش موجودة بيرفض ✅. لكن الحقول `notes` بتقص من غير رسالة (zod `max(500)` هيفشل الطلب كله) — الأفضل `.catch()` أو `trim` وتراجع رسالة الخطأ.

### 25) صفحة login مش بتتحقق هل المستخدم أدمن قبل الـ redirect
**الملف:** `src/app/(admin-auth)/admin/login/page.tsx`

بعد `signInWithPassword` ناجح، بيعمل `router.push('/admin')` — لو المستخدم مش أدمن، هيشوف شاشة "غير مصرح". الأفضل التحقق من `admin_users` بعد الدخول مباشرة وعرض رسالة واضحة (أو تسجيل خروج تلقائي).

---

## ✅ حاجات شغالة صح (تستاهل ذكر)

1. **الأسعار من السيرفر** — الـ API بيجيب الأسعار من الداتابيز مش من العميل ✅
2. **RLS على كل الجداول** ✅
3. **خصم ستوك ذري** — منع البيع بالزيادة في التزامن العادي ✅
4. **Rate limiting للتقييمات** (حتى لو مكسور — في نيته صح)
5. **revalidate بعد تعديل الأدمن** — الكاش بيتحدث فورًا ✅
6. **zod validation** على المدخلات ✅
7. **حماية `/admin` بـ middleware + layout double-check** ✅
8. **order_items snapshot** — بيانات المنتج محفوظة مع الأوردر حتى لو المنتج اتحذف ✅
9. **sitemap + robots + JSON-LD** — SEO أساسي موجود ✅

---

## 📋 خطة الإصلاح المقترحة (بالترتيب)

1. **إغلاق ثغرة admin_insert_first** (5 دقائق — أخطر حاجة)
2. **إصلاح رقم الأوردر** (sequence في الداتابيز)
3. **إصلاح wa.me الدولي** (حرف واحد)
4. **منع تكرار variant_id في decrease_stock** + تجميع الكميات
5. **إصلاح البحث من الهيدر** (search state من searchParams)
6. **rate limiting بالداتابيز** بدل الذاكرة
7. **حذف الصور من Storage** مع حذف المنتج
8. **pagination للطلبات والتقييمات**
9. **timezone مصر في إحصائيات الأدمن**
10. **التحقق من أسعار السلة قبل الدخول للـ checkout**

---

*تمت المراجعة: سبتمبر 2026 — تغطي 45 ملف TypeScript/TSX + 4 ملفات SQL*
