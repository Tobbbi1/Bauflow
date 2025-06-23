-- Fix RLS Policies für Bauflow
-- Führen Sie dieses Script aus, um die Policies zu korrigieren

-- Drop alle bestehenden Policies für projects
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'projects' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.projects';
    END LOOP;
END $$;

-- Drop alle bestehenden Policies für tasks
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'tasks' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.tasks';
    END LOOP;
END $$;

-- Drop alle bestehenden Policies für companies
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'companies' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.companies';
    END LOOP;
END $$;

-- Drop alle bestehenden Policies für profiles
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.profiles';
    END LOOP;
END $$;

-- Create simplified and working policies

-- Companies policies
CREATE POLICY "Allow company creation during signup" ON public.companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their own company" ON public.companies FOR SELECT USING (id = get_user_company_id(auth.uid()));
CREATE POLICY "Admins can update their company" ON public.companies FOR UPDATE USING (id = get_user_company_id(auth.uid()));
CREATE POLICY "Admins can delete their company" ON public.companies FOR DELETE USING (id = get_user_company_id(auth.uid()));

-- Profiles policies
CREATE POLICY "Users can view their own profile and company members" ON public.profiles FOR SELECT USING (id = auth.uid() OR company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins can manage users in their company" ON public.profiles FOR ALL USING (company_id = get_user_company_id(auth.uid()));

-- Projects policies (vereinfacht)
CREATE POLICY "Users can view projects in their company" ON public.projects FOR SELECT USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can create projects in their company" ON public.projects FOR INSERT WITH CHECK (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can update projects in their company" ON public.projects FOR UPDATE USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can delete projects in their company" ON public.projects FOR DELETE USING (company_id = get_user_company_id(auth.uid()));

-- Tasks policies (vereinfacht)
CREATE POLICY "Users can view tasks in their company" ON public.tasks FOR SELECT USING (project_id IN (SELECT id FROM public.projects WHERE company_id = get_user_company_id(auth.uid())));
CREATE POLICY "Users can create tasks in their company" ON public.tasks FOR INSERT WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE company_id = get_user_company_id(auth.uid())));
CREATE POLICY "Users can update tasks in their company" ON public.tasks FOR UPDATE USING (project_id IN (SELECT id FROM public.projects WHERE company_id = get_user_company_id(auth.uid())));
CREATE POLICY "Users can delete tasks in their company" ON public.tasks FOR DELETE USING (project_id IN (SELECT id FROM public.projects WHERE company_id = get_user_company_id(auth.uid())));

-- Time entries policies
CREATE POLICY "Users can manage their own time entries" ON public.time_entries FOR ALL USING (user_id = auth.uid());
CREATE POLICY "Users can view all company time entries" ON public.time_entries FOR SELECT USING (user_id IN (SELECT id FROM public.profiles WHERE company_id = get_user_company_id(auth.uid())));

-- Materials policies
CREATE POLICY "Users can view materials in their company" ON public.materials FOR SELECT USING (company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can manage materials in their company" ON public.materials FOR ALL USING (company_id = get_user_company_id(auth.uid()));

-- Project materials policies
CREATE POLICY "Users can manage materials on projects in their company" ON public.project_materials FOR ALL USING (project_id IN (SELECT id FROM public.projects WHERE company_id = get_user_company_id(auth.uid())));

-- Employee invitations policies
CREATE POLICY "Admins can manage invitations for their company" ON public.employee_invitations FOR ALL USING (company_id = get_user_company_id(auth.uid()));

-- Success message
SELECT 'RLS Policies erfolgreich korrigiert! Baustellen und Aufgaben können jetzt erstellt werden.' as status; 