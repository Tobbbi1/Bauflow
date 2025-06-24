'use client'

import { useState, useEffect, FormEvent } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  PlusCircle, 
  Loader2, 
  AlertCircle, 
  Trash2, 
  Edit, 
  CheckSquare, 
  User, 
  Calendar, 
  FileText, 
  ChevronUp,
  Clock,
  MapPin,
  Users
} from 'lucide-react'

interface Task {
  id: string
  title: string
  description: string
  project_id: string
  project_name: string
  project_color: string
  assigned_to: string
  assigned_to_name: string
  status: string
  priority: string
  start_date: string
  end_date: string
  start_time: string
  end_time: string
  color: string
  created_at: string
}

interface Project {
  id: string
  name: string
  color: string
}

interface Employee {
  id: string
  first_name: string
  last_name: string
}

interface Profile {
  company_id: string
}

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    project_id: '',
    assigned_to: '',
    status: 'pending',
    priority: 'medium',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: ''
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single()
        
        if (profileError) {
          setError('Fehler beim Laden der Benutzerdaten: ' + profileError.message)
          setLoading(false)
          return
        } 
        
        setProfile(profileData)
        
        // Projekte laden
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('id, name, color')
          .order('name')

        if (!projectsError) {
          setProjects(projectsData)
        }

        // Mitarbeiter laden
        const { data: employeesData, error: employeesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .eq('company_id', profileData.company_id)
          .order('first_name')

        if (!employeesError) {
          setEmployees(employeesData)
        }

        // Aufgaben laden
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select(`
            id, title, description, project_id, assigned_to, status, priority, 
            start_date, end_date, start_time, end_time, color, created_at,
            projects(name, color),
            profiles!assigned_to(first_name, last_name)
          `)
          .order('created_at', { ascending: false })

        if (tasksError) {
          setError(tasksError.message)
        } else {
          // Daten formatieren
          const formattedTasks = tasksData.map((task: any) => ({
            id: task.id,
            title: task.title,
            description: task.description,
            project_id: task.project_id,
            project_name: task.projects.name,
            project_color: task.projects.color,
            assigned_to: task.assigned_to,
            assigned_to_name: task.profiles ? `${task.profiles.first_name} ${task.profiles.last_name}` : 'Nicht zugewiesen',
            status: task.status,
            priority: task.priority,
            start_date: task.start_date,
            end_date: task.end_date,
            start_time: task.start_time,
            end_time: task.end_time,
            color: task.color,
            created_at: task.created_at
          }))
          setTasks(formattedTasks)
        }
      }
      setLoading(false)
    }

    fetchInitialData()
  }, [supabase])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (isEditMode && editingTask) {
      setEditingTask(prev => prev ? { ...prev, [name]: value } : null)
    } else {
      setNewTask(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleAddTask = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile) {
      setError("Benutzerprofil nicht geladen. Bitte laden Sie die Seite neu.")
      return
    }
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          setError('Keine gültige Sitzung gefunden. Bitte melden Sie sich erneut an.')
          return
        }

        const response = await fetch('/api/tasks/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(newTask),
        })

        const result = await response.json()
        if (!response.ok) {
          setError(result.error || 'Fehler beim Speichern der Aufgabe')
          return
        }

        // Neue Aufgabe zur Liste hinzufügen
        const project = projects.find(p => p.id === newTask.project_id)
        const employee = employees.find(e => e.id === newTask.assigned_to)
        
        const newTaskWithDetails = {
          ...result.data,
          project_name: project?.name || '',
          project_color: project?.color || '#3B82F6',
          assigned_to_name: employee ? `${employee.first_name} ${employee.last_name}` : 'Nicht zugewiesen'
        }

        setTasks([newTaskWithDetails, ...tasks])
        setNewTask({ 
          title: '', 
          description: '', 
          project_id: '', 
          assigned_to: '', 
          status: 'pending', 
          priority: 'medium', 
          start_date: '', 
          end_date: '', 
          start_time: '', 
          end_time: '' 
        })
        setIsFormVisible(false)
      } catch (apiError) {
        setError('Netzwerkfehler beim Speichern der Aufgabe')
      }
    }
  }

  const handleEditTask = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingTask) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setError('Keine gültige Sitzung gefunden. Bitte melden Sie sich erneut an.')
        return
      }

      const response = await fetch('/api/tasks/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(editingTask),
      })

      const result = await response.json()
      if (!response.ok) {
        setError(result.error || 'Fehler beim Aktualisieren der Aufgabe')
        return
      }

      // Aufgabe in der Liste aktualisieren
      setTasks(prev => prev.map(task => 
        task.id === editingTask.id 
          ? { ...task, ...editingTask }
          : task
      ))

      setEditingTask(null)
      setIsEditMode(false)
    } catch (apiError) {
      setError('Netzwerkfehler beim Aktualisieren der Aufgabe')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Aufgabe löschen möchten?')) {
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setError('Keine gültige Sitzung gefunden. Bitte melden Sie sich erneut an.')
        return
      }

      const response = await fetch(`/api/tasks/delete?id=${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const result = await response.json()
        setError(result.error || 'Fehler beim Löschen der Aufgabe')
        return
      }

      // Aufgabe aus der Liste entfernen
      setTasks(prev => prev.filter(task => task.id !== taskId))
    } catch (apiError) {
      setError('Netzwerkfehler beim Löschen der Aufgabe')
    }
  }

  const startEditTask = (task: Task) => {
    setEditingTask(task)
    setIsEditMode(true)
    setIsFormVisible(true)
  }

  const cancelEdit = () => {
    setEditingTask(null)
    setIsEditMode(false)
    setIsFormVisible(false)
    setNewTask({ 
      title: '', 
      description: '', 
      project_id: '', 
      assigned_to: '', 
      status: 'pending', 
      priority: 'medium', 
      start_date: '', 
      end_date: '', 
      start_time: '', 
      end_time: '' 
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <CheckSquare /> Aufgaben verwalten
        </h2>
        <button
          onClick={() => {
            if (isEditMode) {
              cancelEdit()
            } else {
              setIsFormVisible(!isFormVisible)
            }
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
        >
          {isFormVisible ? <ChevronUp className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
          <span>{isFormVisible ? 'Schließen' : 'Neue Aufgabe'}</span>
        </button>
      </div>
      
      {isFormVisible && (
        <form onSubmit={isEditMode ? handleEditTask : handleAddTask} className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200 animate-fade-in-down">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="md:col-span-2">
              <label htmlFor="title" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                <FileText size={16}/>Aufgaben-Titel
              </label>
              <input 
                id="title" 
                name="title" 
                type="text" 
                value={isEditMode && editingTask ? editingTask.title : newTask.title} 
                onChange={handleInputChange} 
                className="input-field" 
                placeholder="z.B. Fliesen im Bad legen" 
                required 
              />
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="description" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                <FileText size={16}/>Beschreibung
              </label>
              <textarea 
                id="description" 
                name="description" 
                value={isEditMode && editingTask ? editingTask.description : newTask.description} 
                onChange={handleInputChange} 
                className="input-field" 
                rows={3} 
                placeholder="Detaillierte Beschreibung der Aufgabe"
              />
            </div>

            <div>
              <label htmlFor="project_id" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                <MapPin size={16}/>Baustelle
              </label>
              <select 
                id="project_id" 
                name="project_id" 
                value={isEditMode && editingTask ? editingTask.project_id : newTask.project_id} 
                onChange={handleInputChange} 
                className="input-field" 
                required
              >
                <option value="">Baustelle auswählen</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="assigned_to" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                <Users size={16}/>Zugewiesen an
              </label>
              <select 
                id="assigned_to" 
                name="assigned_to" 
                value={isEditMode && editingTask ? editingTask.assigned_to : newTask.assigned_to} 
                onChange={handleInputChange} 
                className="input-field"
              >
                <option value="">Mitarbeiter auswählen</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.first_name} {employee.last_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="start_date" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                <Calendar size={16}/>Start-Datum
              </label>
              <input 
                id="start_date" 
                name="start_date" 
                type="date" 
                value={isEditMode && editingTask ? editingTask.start_date : newTask.start_date} 
                onChange={handleInputChange} 
                className="input-field" 
                required
              />
            </div>

            <div>
              <label htmlFor="end_date" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                <Calendar size={16}/>End-Datum
              </label>
              <input 
                id="end_date" 
                name="end_date" 
                type="date" 
                value={isEditMode && editingTask ? editingTask.end_date : newTask.end_date} 
                onChange={handleInputChange} 
                className="input-field" 
                required
              />
            </div>

            <div>
              <label htmlFor="status" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                <CheckSquare size={16}/>Status
              </label>
              <select 
                id="status" 
                name="status" 
                value={isEditMode && editingTask ? editingTask.status : newTask.status} 
                onChange={handleInputChange} 
                className="input-field"
              >
                <option value="pending">Ausstehend</option>
                <option value="in_progress">In Bearbeitung</option>
                <option value="completed">Abgeschlossen</option>
                <option value="cancelled">Abgebrochen</option>
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                <AlertCircle size={16}/>Priorität
              </label>
              <select 
                id="priority" 
                name="priority" 
                value={isEditMode && editingTask ? editingTask.priority : newTask.priority} 
                onChange={handleInputChange} 
                className="input-field"
              >
                <option value="low">Niedrig</option>
                <option value="medium">Mittel</option>
                <option value="high">Hoch</option>
                <option value="urgent">Dringend</option>
              </select>
            </div>
          </div>
          
          <div className="mt-6 flex gap-3">
            <button 
              type="submit" 
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isEditMode ? (
                <>
                  <Edit className="w-5 h-5" />
                  <span>Aufgabe aktualisieren</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-5 h-5" />
                  <span>Aufgabe erstellen</span>
                </>
              )}
            </button>
            {isEditMode && (
              <button 
                type="button" 
                onClick={cancelEdit}
                className="px-4 py-2 bg-gray-500 text-white font-semibold rounded-lg shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Abbrechen
              </button>
            )}
          </div>
          
          {error && (
            <div className="mt-4 bg-red-50 p-3 rounded-md flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-5 w-5"/>
              <span>Fehler: {error}</span>
            </div>
          )}
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Aufgabe</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Baustelle</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mitarbeiter</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Zeitraum</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Aktionen</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {tasks.map((task) => (
              <tr key={task.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-3" 
                      style={{ backgroundColor: task.color }}
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-900">{task.title}</div>
                      {task.description && (
                        <div className="text-sm text-slate-500 truncate max-w-xs">{task.description}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-900">{task.project_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-900">{task.assigned_to_name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {task.start_date && new Date(task.start_date).toLocaleDateString()} - {task.end_date && new Date(task.end_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(task.status)}`}>
                      {task.status === 'completed' ? 'Abgeschlossen' :
                       task.status === 'in_progress' ? 'In Bearbeitung' :
                       task.status === 'pending' ? 'Ausstehend' :
                       task.status === 'cancelled' ? 'Abgebrochen' : task.status}
                    </span>
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                      {task.priority === 'urgent' ? 'Dringend' :
                       task.priority === 'high' ? 'Hoch' :
                       task.priority === 'medium' ? 'Mittel' :
                       task.priority === 'low' ? 'Niedrig' : task.priority}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={() => startEditTask(task)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <Edit className="w-4 h-4"/>
                  </button>
                  <button 
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {tasks.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <CheckSquare className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p>Noch keine Aufgaben erstellt.</p>
          <p className="text-sm">Erstellen Sie Ihre erste Aufgabe, um zu beginnen.</p>
        </div>
      )}
      
      <style jsx>{`
        .input-field {
          appearance: none; 
          display: block; 
          width: 100%;
          padding: 0.5rem 0.75rem; 
          border: 1px solid #cbd5e1;
          border-radius: 0.375rem; 
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
          background-color: white;
          color: #0f172a;
        }
        .input-field::placeholder {
          color: #94a3b8;
        }
        .input-field:focus {
          outline: none; 
          --tw-ring-color: #3b82f6; 
          border-color: #3b82f6;
          box-shadow: 0 0 0 1px #3b82f6;
        }
        @keyframes fade-in-down {
          0% {
            opacity: 0;
            transform: translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.3s ease-out;
        }
      `}</style>
    </div>
  )
} 