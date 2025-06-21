'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import ProjectDetail from './ProjectDetail'

interface Project {
  id: string
  name: string
  description: string
  created_at: string
}

export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [newProject, setNewProject] = useState({ name: '', description: '' })
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  useEffect(() => {
    fetchProjects()
  }, [])

  async function fetchProjects() {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (error: any) {
      console.error('Fehler beim Laden der Projekte:', error)
      if (error) {
        alert(`Fehler beim Laden der Projekte: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  async function addProject() {
    if (!newProject.name.trim()) return

    try {
      const { error } = await supabase
        .from('projects')
        .insert([newProject])

      if (error) throw error

      setNewProject({ name: '', description: '' })
      fetchProjects()
    } catch (error: any) {
      console.error('Fehler beim Erstellen des Projekts:', error)
      if (error) {
        alert(`Fehler beim Erstellen des Projekts: ${error.message}`)
      }
    }
  }

  if (selectedProjectId) {
    return (
      <ProjectDetail 
        projectId={selectedProjectId} 
        onBack={() => setSelectedProjectId(null)} 
      />
    )
  }

  if (loading) {
    return <div className="text-center py-8">Lade Projekte...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Bauplaner</h1>
      
      {/* Neues Projekt Formular */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Neues Projekt erstellen</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Projektname
            </label>
            <input
              type="text"
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Projektname eingeben"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Beschreibung
            </label>
            <textarea
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Projektbeschreibung eingeben"
            />
          </div>
          <button
            onClick={addProject}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Projekt erstellen
          </button>
        </div>
      </div>

      {/* Projektliste */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Ihre Projekte</h2>
        {projects.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Noch keine Projekte vorhanden. Erstellen Sie Ihr erstes Projekt!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedProjectId(project.id)}>
                <h3 className="text-lg font-semibold mb-2">{project.name}</h3>
                {project.description && (
                  <p className="text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                )}
                <p className="text-sm text-gray-500 mb-4">
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