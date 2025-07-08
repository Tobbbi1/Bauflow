'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Building2, Plus, Calendar, MapPin, User, Edit, Trash2, Eye } from 'lucide-react'

interface Customer {
  id: string
  name: string
  contact_person?: string
  contact_phone?: string
}

interface Project {
  id: string
  name: string
  description?: string
  address?: string
  color: string
  customers?: Customer
  created_at: string
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects/list')
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteProject = async (id: string) => {
    if (!confirm('Möchten Sie diese Baustelle wirklich löschen?')) return

    try {
      const response = await fetch(`/api/projects/delete?id=${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        fetchProjects()
      }
    } catch (error) {
      console.error('Error deleting project:', error)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Baustellen werden geladen...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Baustellen</h1>
          <p className="text-slate-600">Verwalten Sie Ihre Bauprojekte und Aufträge</p>
        </div>
        <Link
          href="/app/projects/create"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Neue Baustelle
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Aktive Baustellen</p>
              <p className="text-3xl font-bold text-slate-900">{projects.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Termine diese Woche</p>
              <p className="text-3xl font-bold text-slate-900">12</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Abgeschlossen</p>
              <p className="text-3xl font-bold text-slate-900">8</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Gesamtwert</p>
              <p className="text-3xl font-bold text-slate-900">€85k</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Building2 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Keine Baustellen vorhanden</h3>
          <p className="text-slate-600 mb-6">Erstellen Sie Ihre erste Baustelle, um loszulegen.</p>
          <Link
            href="/app/projects/create"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Erste Baustelle erstellen
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              {/* Project Header */}
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: project.color }}
                    ></div>
                    <h3 className="text-lg font-semibold text-slate-900">{project.name}</h3>
                  </div>
                  <div className="flex gap-1">
                    <Link
                      href={`/app/projects/${project.id}`}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                      title="Details anzeigen"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                      title="Bearbeiten"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteProject(project.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {project.description && (
                  <p className="text-slate-600 text-sm mb-3">{project.description}</p>
                )}
              </div>

              {/* Project Details */}
              <div className="p-6 space-y-3">
                {project.customers && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <User className="w-4 h-4" />
                    <div>
                      <p className="text-sm font-medium">{project.customers.name}</p>
                      {project.customers.contact_person && (
                        <p className="text-xs text-slate-500">{project.customers.contact_person}</p>
                      )}
                    </div>
                  </div>
                )}

                {project.address && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <p className="text-sm">{project.address}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar className="w-4 h-4" />
                  <p className="text-sm">Erstellt: {formatDate(project.created_at)}</p>
                </div>
              </div>

              {/* Project Actions */}
              <div className="p-6 pt-0">
                <div className="flex gap-2">
                  <Link
                    href={`/app/projects/${project.id}/appointments/create`}
                    className="flex-1 px-4 py-2 bg-blue-50 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors text-center"
                  >
                    Termin hinzufügen
                  </Link>
                  <Link
                    href={`/app/projects/${project.id}`}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors"
                  >
                    Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 