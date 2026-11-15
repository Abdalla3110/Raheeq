-- ============================================================
-- إصلاح شامل نهائي: منح الصلاحيات على كل الجداول الحالية
-- شغّله مرة واحدة في: Supabase Dashboard > SQL Editor > Run
-- ============================================================

do $$
declare
  r record;
begin
  -- لكل جدول في سكيما public منح كل الصلاحيات لكل الأدوار
  -- (الـ RLS فوق الكلام ده هو اللي بيحكم الحماية الفعلية)
  for r in select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('grant select on public.%I to anon, authenticated, service_role', r.tablename);
    execute format('grant insert, update, delete on public.%I to authenticated, service_role', r.tablename);
  end loop;

  -- الدوال
  for r in
    select p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
  loop
    execute format('grant execute on function public.%I(%s) to anon, authenticated, service_role', r.proname, r.args);
  end loop;
end $$;

alter default privileges in schema public
  grant select on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant insert, update, delete on tables to authenticated, service_role;
alter default privileges in schema public
  grant execute on functions to anon, authenticated, service_role;

-- تم ✅ — جرّب تضيف الخصم تاني من الأدمن
