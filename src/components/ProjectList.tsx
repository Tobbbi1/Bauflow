'use client'

import { useState, useEffect, FormEvent } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { PlusCircle, Loader2, AlertCircle, Trash2, Edit } from 'lucide-react'

interface Project {
  id: string
  name: string
  address: string
  status: string
  created_at: string
}

export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([])
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectAddress, setNewProjectAddress] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data, error } = await supabase
          .from('projects')
          .select('id, name, address, status, created_at')
          .order('created_at', { ascending: false })

        if (error) {
          setError(error.message)
        } else {
          setProjects(data)
        }
      }
      setLoading(false)
    }

    fetchProjects()
  }, [supabase])

  const handleAddProject = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()

    if (user && newProjectName && newProjectAddress) {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: newProjectName,
          address: newProjectAddress,
          created_by: user.id,
          // company_id is set by a trigger/default in the database
        })
        .select()
        .single()

      if (error) {
        setError(error.message)
      } else if (data) {
        setProjects([data, ...projects])
        setNewProjectName('')
        setNewProjectAddress('')
      }
    }
  }

  if (loading) {
    return (
        <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Projekte verwalten</h2>
      
      <form onSubmit={handleAddProject} className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label htmlFor="projectName" className="block text-sm font-medium text-slate-700 mb-1">Projektname</label>
            <input
              id="projectName"
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="z.B. Neubau EFH Meier"
              required
            />
          </div>
          <div>
            <label htmlFor="projectAddress" className="block text-sm font-medium text-slate-700 mb-1">Adresse</label>
            <input
              id="projectAddress"
              type="text"
              value={newProjectAddress}
              onChange={(e) => setNewProjectAddress(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="z.B. Hauptstraße 1, 12345 Berlin"
              required
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Projekt hinzufügen</span>
            </button>
          </div>
        </div>
        {error && (
            <div className="mt-4 bg-red-50 p-3 rounded-md flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-5 w-5"/>
                <span>Fehler: {error}</span>
            </div>
        )}
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Projektname</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Erstellt am</th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Aktionen</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {projects.map((project) => (
              <tr key={project.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-slate-900">{project.name}</div>
                  <div className="text-sm text-slate-500">{project.address}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      project.status === 'active' ? 'bg-green-100 text-green-800' :
                      project.status === 'planning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-slate-100 text-slate-800'
                  }`}>
                    {project.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {new Date(project.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-4"><Edit className="w-4 h-4"/></button>
                  <button className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4"/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 