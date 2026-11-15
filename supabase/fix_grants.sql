-- ============================================================
-- إصلاح: منح الصلاحيات لكل الأدوار بما فيها service_role
-- شغّل الملف ده مرة واحدة في: Supabase Dashboard > SQL Editor > Run
-- ============================================================

-- منح الصلاحيات على سكيما public لكل الأدوار
grant usage on schema public to anon, authenticated, service_role;
grant select on all tables in schema public to anon, authenticated, service_role;
grant insert, update, delete on all tables in schema public to authenticated, service_role;

-- أي جدول جديد هيأخذ نفس الصلاحيات تلقائيًا
alter default privileges in schema public
  grant select on tables to anon, authenticated, service_role;

alter default privileges in schema public
  grant insert, update, delete on tables to authenticated, service_role;

-- صلاحيات تنفيذ الدوال (مهمة لـ next_order_number و decrease_stock)
grant execute on all functions in schema public to anon, authenticated, service_role;

alter default privileges in schema public
  grant execute on functions to anon, authenticated, service_role;

-- ملاحظة: الـ RLS شغال فوق الكلام ده — الصلاحيات دي مش بتعدي أي حماية.

-- تم ✅ — جرب تعمل الأوردر تاني
