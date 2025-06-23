-- Komplettes Fix-Script für alle RLS Policies
-- Führen Sie dieses Script aus, um alle Policies zu korrigieren

-- Drop ALL existing policies for ALL tables (sicher)
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    -- Drop policies for companies
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'companies' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.companies';
    END LOOP;
    
    -- Drop policies for profiles
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.profiles';
    END LOOP;
    
    -- Drop policies for projects
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'projects' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.projects';
    END LOOP;
    
    -- Drop policies for tasks
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'tasks' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.tasks';
    END LOOP;
    
    -- Drop policies for time_entries (falls Tabelle existiert)
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'time_entries' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.time_entries';
    END LOOP;
    
    -- Drop policies for materials (falls Tabelle existiert)
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'materials' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.materials';
    END LOOP;
    
    -- Drop policies for project_materials (falls Tabelle existiert)
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'project_materials' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.project_materials';
    END LOOP;
    
    -- Drop policies for employee_invitations (falls Tabelle existiert)
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'employee_invitations' AND schemaname = 'public') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.employee_invitations';
    END LOOP;
END $$;

-- Create simplified and working policies

-- Companies policies
CREATE POLICY "Allow company creation during signup" ON public.companies FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view their own company" ON public.companies FOR SELECT USING (id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can update their company" ON public.companies FOR UPDATE USING (id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can delete their company" ON public.companies FOR DELETE USING (id = get_user_company_id(auth.uid()));

-- Profiles policies
CREATE POLICY "Users can view their own profile and company members" ON public.profiles FOR SELECT USING (id = auth.uid() OR company_id = get_user_company_id(auth.uid()));
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Users can manage users in their company" ON public.profiles FOR ALL USING (company_id = get_user_company_id(auth.uid()));

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

-- Time entries policies (nur falls Tabelle existiert)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'time_entries') THEN
        EXECUTE 'CREATE POLICY "Users can manage their own time entries" ON public.time_entries FOR ALL USING (user_id = auth.uid())';
        EXECUTE 'CREATE POLICY "Users can view all company time entries" ON public.time_entries FOR SELECT USING (user_id IN (SELECT id FROM public.profiles WHERE company_id = get_user_company_id(auth.uid())))';
    END IF;
END $$;

-- Materials policies (nur falls Tabelle existiert)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'materials') THEN
        EXECUTE 'CREATE POLICY "Users can view materials in their company" ON public.materials FOR SELECT USING (company_id = get_user_company_id(auth.uid()))';
        EXECUTE 'CREATE POLICY "Users can manage materials in their company" ON public.materials FOR ALL USING (company_id = get_user_company_id(auth.uid()))';
    END IF;
END $$;

-- Project materials policies (nur falls Tabelle existiert)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_materials') THEN
        EXECUTE 'CREATE POLICY "Users can manage materials on projects in their company" ON public.project_materials FOR ALL USING (project_id IN (SELECT id FROM public.projects WHERE company_id = get_user_company_id(auth.uid())))';
    END IF;
END $$;

-- Employee invitations policies (nur falls Tabelle existiert)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employee_invitations') THEN
        EXECUTE 'CREATE POLICY "Users can manage invitations for their company" ON public.employee_invitations FOR ALL USING (company_id = get_user_company_id(auth.uid()))';
    END IF;
END $$;

-- Success message
SELECT 'Alle RLS Policies erfolgreich korrigiert! Baustellen und Aufgaben können jetzt erstellt werden.' as status; 