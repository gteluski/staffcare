
-- =============================================
-- 1. FIX ministry_history: public → authenticated
-- =============================================
DROP POLICY IF EXISTS "Users can view own ministry_history" ON public.ministry_history;
DROP POLICY IF EXISTS "Users can create own ministry_history" ON public.ministry_history;
DROP POLICY IF EXISTS "Users can update own ministry_history" ON public.ministry_history;
DROP POLICY IF EXISTS "Users can delete own ministry_history" ON public.ministry_history;

CREATE POLICY "Users can view own ministry_history" ON public.ministry_history
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own ministry_history" ON public.ministry_history
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ministry_history" ON public.ministry_history
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ministry_history" ON public.ministry_history
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- 2. FIX ministry_plans: public → authenticated
-- =============================================
DROP POLICY IF EXISTS "Users can view own ministry_plans" ON public.ministry_plans;
DROP POLICY IF EXISTS "Users can create own ministry_plans" ON public.ministry_plans;
DROP POLICY IF EXISTS "Users can update own ministry_plans" ON public.ministry_plans;
DROP POLICY IF EXISTS "Users can delete own ministry_plans" ON public.ministry_plans;

CREATE POLICY "Users can view own ministry_plans" ON public.ministry_plans
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own ministry_plans" ON public.ministry_plans
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ministry_plans" ON public.ministry_plans
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ministry_plans" ON public.ministry_plans
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- 3. FIX missionary_trips: public → authenticated
-- =============================================
DROP POLICY IF EXISTS "Users can view own missionary_trips" ON public.missionary_trips;
DROP POLICY IF EXISTS "Users can create own missionary_trips" ON public.missionary_trips;
DROP POLICY IF EXISTS "Users can update own missionary_trips" ON public.missionary_trips;
DROP POLICY IF EXISTS "Users can delete own missionary_trips" ON public.missionary_trips;

CREATE POLICY "Users can view own missionary_trips" ON public.missionary_trips
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own missionary_trips" ON public.missionary_trips
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own missionary_trips" ON public.missionary_trips
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own missionary_trips" ON public.missionary_trips
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- 4. FIX spiritual_experiences: public → authenticated
-- =============================================
DROP POLICY IF EXISTS "Users can view own spiritual_experiences" ON public.spiritual_experiences;
DROP POLICY IF EXISTS "Users can create own spiritual_experiences" ON public.spiritual_experiences;
DROP POLICY IF EXISTS "Users can update own spiritual_experiences" ON public.spiritual_experiences;
DROP POLICY IF EXISTS "Users can delete own spiritual_experiences" ON public.spiritual_experiences;

CREATE POLICY "Users can view own spiritual_experiences" ON public.spiritual_experiences
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own spiritual_experiences" ON public.spiritual_experiences
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own spiritual_experiences" ON public.spiritual_experiences
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own spiritual_experiences" ON public.spiritual_experiences
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- 5. FIX storage: replace broad policies with role-specific ones
-- =============================================
DROP POLICY IF EXISTS "Block client uploads to methodist-docs" ON storage.objects;
DROP POLICY IF EXISTS "Block client updates to methodist-docs" ON storage.objects;
DROP POLICY IF EXISTS "Block client deletes from methodist-docs" ON storage.objects;

-- Block anon from ALL writes (anon should never write to any bucket)
CREATE POLICY "Deny anon insert on storage" ON storage.objects
  FOR INSERT TO anon WITH CHECK (false);
CREATE POLICY "Deny anon update on storage" ON storage.objects
  FOR UPDATE TO anon USING (false);
CREATE POLICY "Deny anon delete on storage" ON storage.objects
  FOR DELETE TO anon USING (false);

-- Block authenticated users from writing to methodist-docs specifically
CREATE POLICY "Block auth uploads to methodist-docs" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id != 'methodist-docs');
CREATE POLICY "Block auth updates to methodist-docs" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id != 'methodist-docs');
CREATE POLICY "Block auth deletes from methodist-docs" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id != 'methodist-docs');
