# مِسك للعطور 🌸

متجر عطور إلكتروني كامل — **Next.js 15 + Supabase + Tailwind + Framer Motion**

## المحتويات
- واجهة عميل: هوم بأنيميشن، منتجات بفلترة، تفاصيل منتج بالجاليري والأحجام، مفضلة، سلة، إتمام طلب كاش عند الاستلام
- لوحة تحكم أدمن: إحصائيات (اليوم/أمس/5 أيام/مخصص + Gross/Net Sales)، إدارة منتجات وعروض، أوردرات بتغيير حالة وسجل، تقييمات باعتماد، مناطق شحن
- أمان: Supabase Auth + RLS على كل الجداول + تحقق سيرفري للأسعار والستوك

---

## الإعداد خطوة بخطوة

### 1) إنشاء مشروع Supabase (5 دقائق)
1. ادخل [supabase.com](https://supabase.com) وسجل حساب مجاني
2. **New project** → اسمه `misk-perfumes` → كلمة سر قوية (احفظها) → Region: أقرب منطقة
3. استنى دقيقة لحد ما المشروع يجهز

### 2) تشغيل السكيما
1. من لوحة Supabase: **SQL Editor** → **New query**
2. انسخ محتوى ملف `supabase/schema.sql` كامل والصقه → **Run**
3. كرر نفس الخطوة مع `supabase/seed.sql` (بيانات تجريبية + مناطق شحن)

**ملاحظة هامة للتحديثات**: إذا كنت تقوم بتحديث مشروع موجود، تأكد من تشغيل الـ schema المحدث الذي يتضمن:
- جدول `rate_limits` الجديد لتتبع rate limiting
- دالة `check_rate_limit` للتحقق من الحدود
- تحديثات في RLS policies

### 3) إنشاء حساب الأدمن
1. من لوحة Supabase: **Authentication** → **Users** → **Add user**
2. اكتب بريد إلكتروني وكلمة سر → ✅ **Auto Confirm User** → Save
3. انسخ الـ **User ID** (UUID) بتاع المستخدم الجديد
4. ارجع لـ **SQL Editor** وشغّل:

```sql
insert into public.admin_users (id, role)
values ('الصق-الـ-UUID-هنا', 'admin');
```

> 🔒 لو حصل خطأ في الـ insert ده بسبب RLS، شغّله مؤقتًا من وضع "Permissive" أو استخدم الـ Service Role — أول أدمن بيتضاف مرة واحدة بس.

### 4) مفاتيح البيئة
1. من لوحة Supabase: **Settings** → **API**
2. اعمل ملف `.env.local` في جذر المشروع (انسخ من `.env.example`):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (anon public)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (service_role — سري جدًا، متشاركوش)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 5) تشغيل محلي
```bash
npm install
npm run dev
```
- المتجر: http://localhost:3000
- لوحة الأدمن: http://localhost:3000/admin (ببريد وكلمة سر الأدمن)

### 6) النشر على Vercel (دومين مجاني)
1. ارفع المشروع على GitHub:
   ```bash
   git init && git add . && git commit -m "Initial commit"
   git remote add origin https://github.com/USERNAME/misk-perfumes.git
   git push -u origin main
   ```
2. ادخل [vercel.com](https://vercel.com) بحساب GitHub → **Add New Project** → اختار المستودع
3. في إعدادات المشروع: **Environment Variables** → أضف نفس متغيرات `.env.local` (غيّر `NEXT_PUBLIC_SITE_URL` لرابط فيرسل: `https://your-app.vercel.app`)
4. **Deploy** — هتاخد رابط مجاني `*.vercel.app`
5. بعد شراء دومين لاحقًا: **Settings → Domains** → أضفه واتبع التعليمات

---

## البنية

```
src/
├── app/
│   ├── page.tsx                  # الهوم
│   ├── products/                 # القائمة + [slug] التفاصيل
│   ├── favorites/ cart/ checkout/ order-success/
│   ├── admin/                    # داشبورد، منتجات، أوردرات، تقييمات، شحن
│   ├── api/orders/               # إنشاء أوردر (تحقق سيرفري + ستوك ذري)
│   ├── api/reviews/              # إضافة تقييم (rate limit)
│   └── sitemap.ts / robots.ts
├── components/                   # Header, Footer, ProductCard, ...
├── lib/
│   ├── store.tsx                 # سلة + مفضلة (localStorage)
│   ├── pricing.ts types.ts constants.ts
│   └── supabase/                 # client / server / admin(service-role)
└── middleware.ts                 # حماية /admin
supabase/
├── schema.sql                    # الجداول + RLS + الدوال
└── seed.sql                      # بيانات تجريبية
```

## ملاحظات أمان مهمة
- `SUPABASE_SERVICE_ROLE_KEY` للسيرفر فقط — بيستخدم في API الأوردر والـ sitemap
- الأسعار والستوك بيتحسبوا **من الداتابيز في السيرفر** وقت إنشاء الأوردر — تعديل السلة في المتصفح مبيأثرش
- خصم الستوك بيحصل في **دالة ذرية** تمنع البيع بالزيادة
- التقييمات بتظهر بعد موافقة الأدمن فقط + rate limiting محسّن باستخدام Supabase
- CSRF protection مُضاف لصفحة checkout
- التحقق من صلاحية الأدمن محسّن في middleware
- Validation للصور عند الرفع (النوع والحجم)
- التحقق من تكرار slug عند إنشاء المنتجات

## Phase 2 (جاهز معماريًا)
إشعارات واتساب آلية، بوابات دفع أونلاين، كوبونات، حسابات عملاء، إشعارات بريد.
