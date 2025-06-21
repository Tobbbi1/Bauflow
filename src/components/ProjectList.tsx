'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import ProjectDetail from './ProjectDetail'
import type { User } from '@supabase/supabase-js'

interface Project {
  id: string
  name: string
  description: string
  created_at: string
}

interface Profile {
    company_id: string;
}

export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  const fetchUserData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    if (user) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error("Error fetching profile:", profileError);
      } else {
        setProfile(profileData);
      }
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    if (!profile) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (error: any) {
      alert(`Fehler beim Laden der Projekte: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }, [profile]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    if (profile) {
        fetchProjects();
    }
  }, [profile, fetchProjects]);


  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !user || !profile) return

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{ 
            name: newProjectName,
            description: newProjectDescription,
            created_by: user.id,
            company_id: profile.company_id
        }])
        .select()

      if (error) throw error

      if (data) {
        setProjects([data[0] as Project, ...projects])
        setNewProjectName('')
        setNewProjectDescription('')
      }
    } catch (error: any) {
      alert(`Fehler beim Erstellen des Projekts: ${error.message}`)
    }
  }

  if (selectedProject) {
    return (
      <ProjectDetail 
        project={selectedProject}
        onBack={() => setSelectedProject(null)} 
      />
    )
  }

  if (loading) {
    return <div className="text-center py-8 text-foreground">Lade Projekte...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8 text-foreground">Bauplaner</h1>
      
      <div className="bg-background-card rounded-lg shadow-md p-6 mb-8 border border-border-color">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Neues Projekt erstellen</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground-muted mb-1">
              Projektname
            </label>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full px-3 py-2 border border-border-color rounded-md bg-background-input text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="z.B. Neubau EFH Meier"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground-muted mb-1">
              Beschreibung
            </label>
            <textarea
              value={newProjectDescription}
              onChange={(e) => setNewProjectDescription(e.target.value)}
              className="w-full px-3 py-2 border border-border-color rounded-md bg-background-input text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Kurze Beschreibung des Projekts"
            />
          </div>
          <button
            onClick={handleCreateProject}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Projekt erstellen
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Ihre Projekte</h2>
        {projects.length === 0 ? (
          <div className="text-center py-8 text-foreground-muted">
            Noch keine Projekte vorhanden. Erstellen Sie Ihr erstes Projekt!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-background-card rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-border-color" onClick={() => setSelectedProject(project)}>
                <h3 className="text-lg font-semibold mb-2 text-foreground">{project.name}</h3>
                {project.description && (
                  <p className="text-foreground-muted mb-3 line-clamp-2">{project.description}</p>
                )}
                <p className="text-sm text-foreground-muted mb-4">
                  Erstellt am: {new Date(project.created_at).toLocaleDateString('de-DE')}
                </p>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Details anzeigen →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 