'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  Calendar, 
  Loader2, 
  AlertCircle, 
  Clock, 
  MapPin, 
  User, 
  ChevronLeft, 
  ChevronRight,
  Building2,
  CheckSquare,
  Star
} from 'lucide-react'

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  color: string
  type: 'project' | 'task'
  description?: string
  project_name?: string
  assigned_to?: string
  status?: string
  priority?: string
  project_color?: string
}

interface Profile {
  id: string
  company_id: string
  role: string
  first_name: string
  last_name: string
}

export default function EmployeeCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [hoveredEvent, setHoveredEvent] = useState<CalendarEvent | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ x: number, y: number } | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          setError('Nicht angemeldet')
          setLoading(false)
          return
        }

        // Profil laden
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, company_id, role, first_name, last_name')
          .eq('id', user.id)
          .single()

        if (profileError || !profileData) {
          setError('Fehler beim Laden der Benutzerdaten: ' + (profileError?.message || 'Profil nicht gefunden'))
          setLoading(false)
          return
        }

        setProfile(profileData)

        // Alle Baustellen der Firma laden
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('id, name, color, start_date, end_date, description')
          .eq('company_id', profileData.company_id)
          .not('start_date', 'is', null)
          .not('end_date', 'is', null)

        if (projectsError) {
          console.error('Fehler beim Laden der Baustellen:', projectsError)
        }

        // Aufgaben des Mitarbeiters laden
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select(`
            id, title, description, start_date, end_date, color, status, priority,
            projects!inner(name, color, company_id),
            profiles!assigned_to(first_name, last_name)
          `)
          .eq('projects.company_id', profileData.company_id)
          .eq('assigned_to', user.id)
          .not('start_date', 'is', null)
          .not('end_date', 'is', null)

        if (tasksError) {
          console.error('Fehler beim Laden der Aufgaben:', tasksError)
        }

        const allEvents: CalendarEvent[] = []

        // Baustellen als Events hinzufügen
        if (projectsData) {
          projectsData.forEach(project => {
            allEvents.push({
              id: `project-${project.id}`,
              title: project.name,
              start: new Date(project.start_date),
              end: new Date(project.end_date),
              color: project.color || '#3B82F6',
              type: 'project',
              description: project.description
            })
          })
        }

        // Aufgaben als Events hinzufügen
        if (tasksData) {
          tasksData.forEach((task: any) => {
            allEvents.push({
              id: `task-${task.id}`,
              title: task.title,
              start: new Date(task.start_date),
              end: new Date(task.end_date),
              color: task.color || '#10B981',
              type: 'task',
              description: task.description,
              project_name: task.projects?.name,
              project_color: task.projects?.color,
              assigned_to: `${task.profiles?.first_name} ${task.profiles?.last_name}`,
              status: task.status,
              priority: task.priority
            })
          })
        }

        console.log('Geladene Events:', allEvents)
        setEvents(allEvents)
      } catch (error) {
        console.error('Fehler beim Laden der Events:', error)
        setError('Ein unerwarteter Fehler ist aufgetreten')
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [supabase])

  // Wochentage generieren
  const getWeekDays = () => {
    const days = []
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1)

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      days.push(day)
    }
    return days
  }

  // Events für einen Tag finden
  const getEventsForDay = (date: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end)
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)

      return eventStart <= dayEnd && eventEnd >= dayStart
    })
  }

  // Event-Icon
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'project':
        return <Building2 className="w-3 h-3 mr-1" />
      case 'task':
        return <CheckSquare className="w-3 h-3 mr-1" />
      default:
        return null
    }
  }

  // Status-Text übersetzen
  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': 'Ausstehend',
      'in_progress': 'In Bearbeitung',
      'completed': 'Abgeschlossen',
      'cancelled': 'Abgebrochen'
    }
    return statusMap[status] || status
  }

  // Priorität-Text übersetzen
  const getPriorityText = (priority: string) => {
    const priorityMap: { [key: string]: string } = {
      'low': 'Niedrig',
      'medium': 'Mittel',
      'high': 'Hoch',
      'urgent': 'Dringend'
    }
    return priorityMap[priority] || priority
  }

  // Event klicken
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    console.log('Event geklickt:', event)
  }

  // Modal schließen
  const closeModal = () => {
    setSelectedEvent(null)
  }

  // Navigation
  const previousWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() - 7)
    setCurrentDate(newDate)
  }

  const nextWeek = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + 7)
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg flex items-center gap-2 text-red-600">
        <AlertCircle className="h-5 w-5" />
        <span>{error}</span>
      </div>
    )
  }

  const weekDays = getWeekDays()

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-slate-800">Mein Kalender</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={previousWeek}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Heute
          </button>
          <button
            onClick={nextWeek}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Willkommensbereich */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-700 mb-2">
          {currentDate.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
        </h3>
        {profile && (
          <p className="text-slate-600">
            Willkommen, {profile.first_name} {profile.last_name}!
          </p>
        )}
      </div>

      {/* Kalender-Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
          <div key={day} className="p-3 text-center text-sm font-medium text-slate-500 bg-slate-50 rounded-md">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day, index) => {
          const dayEvents = getEventsForDay(day)
          const isToday = day.toDateString() === new Date().toDateString()
          
          return (
            <div
              key={index}
              className={`min-h-32 p-2 border border-slate-200 rounded-md ${
                isToday ? 'bg-blue-50 border-blue-300' : 'bg-white'
              }`}
            >
              <div className={`text-sm font-medium mb-2 ${
                isToday ? 'text-blue-600' : 'text-slate-700'
              }`}>
                {day.getDate()}
              </div>
              
              <div className="space-y-1">
                {dayEvents.map(event => {
                  const eventColor = event.type === 'task' && event.project_color ? event.project_color : event.color
                  
                  return (
                    <div
                      key={event.id}
                      className="text-xs p-2 rounded cursor-pointer transition-all hover:scale-105 border-l-3"
                      style={{ 
                        backgroundColor: eventColor + '20', 
                        borderLeftColor: eventColor 
                      }}
                      onClick={() => handleEventClick(event)}
                      onMouseEnter={e => {
                        setHoveredEvent(event)
                        setTooltipPos({ x: e.clientX, y: e.clientY })
                      }}
                      onMouseMove={e => setTooltipPos({ x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => { setHoveredEvent(null); setTooltipPos(null) }}
                      title={event.title}
                    >
                      <div className="flex items-center">
                        {getEventIcon(event.type)}
                        <span className="font-medium truncate" style={{ color: eventColor }}>
                          {event.title}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Tooltip für Event Details */}
      {hoveredEvent && tooltipPos && (
        <div
          className="fixed z-50 bg-white border border-slate-200 rounded-lg shadow-lg p-4 max-w-sm pointer-events-none"
          style={{
            left: tooltipPos.x + 12,
            top: tooltipPos.y + 12,
          }}
        >
          <div className="flex items-start gap-3">
            <div 
              className="w-4 h-4 rounded-full mt-1 flex-shrink-0" 
              style={{ 
                backgroundColor: hoveredEvent.type === 'task' && hoveredEvent.project_color 
                  ? hoveredEvent.project_color 
                  : hoveredEvent.color 
              }}
            />
            <div className="flex-1">
              <h4 className="font-semibold text-slate-900 mb-1">
                {hoveredEvent.title}
              </h4>
              
              {hoveredEvent.description && (
                <p className="text-sm text-slate-600 mb-2">
                  {hoveredEvent.description}
                </p>
              )}

              <div className="space-y-1 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {hoveredEvent.start.toLocaleDateString('de-DE')} - {hoveredEvent.end.toLocaleDateString('de-DE')}
                  </span>
                </div>

                {hoveredEvent.type === 'task' && hoveredEvent.project_name && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{hoveredEvent.project_name}</span>
                  </div>
                )}

                {hoveredEvent.type === 'task' && hoveredEvent.status && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100">
                      {getStatusText(hoveredEvent.status)}
                    </span>
                  </div>
                )}

                {hoveredEvent.type === 'task' && hoveredEvent.priority && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-slate-100">
                      {getPriorityText(hoveredEvent.priority)}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-200">
                <span className="text-xs text-slate-500">
                  {hoveredEvent.type === 'project' ? 'Baustelle' : 'Aufgabe'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div 
                className="w-6 h-6 rounded-full mt-1 flex-shrink-0" 
                style={{ 
                  backgroundColor: selectedEvent.type === 'task' && selectedEvent.project_color 
                    ? selectedEvent.project_color 
                    : selectedEvent.color 
                }}
              />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {selectedEvent.title}
                </h3>
                <p className="text-sm text-slate-500">
                  {selectedEvent.type === 'project' ? 'Baustelle' : 'Aufgabe'}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            {selectedEvent.description && (
              <p className="text-slate-600 mb-4">
                {selectedEvent.description}
              </p>
            )}

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">
                  {selectedEvent.start.toLocaleDateString('de-DE')} - {selectedEvent.end.toLocaleDateString('de-DE')}
                </span>
              </div>

              {selectedEvent.type === 'task' && selectedEvent.project_name && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">Baustelle: {selectedEvent.project_name}</span>
                </div>
              )}

              {selectedEvent.type === 'task' && selectedEvent.status && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-3 py-1 rounded-full bg-slate-100">
                    Status: {getStatusText(selectedEvent.status)}
                  </span>
                </div>
              )}

              {selectedEvent.type === 'task' && selectedEvent.priority && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-3 py-1 rounded-full bg-slate-100">
                    Priorität: {getPriorityText(selectedEvent.priority)}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legende */}
      <div className="mt-6 p-4 bg-slate-50 rounded-lg">
        <h4 className="font-medium text-slate-700 mb-3">Legende:</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Baustellen</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-green-600" />
            <span>Meine Aufgaben</span>
          </div>
        </div>
        <div className="mt-3 text-xs text-slate-500">
          <p>• Klicken Sie auf ein Event für weitere Details</p>
        </div>
      </div>

      {/* Statistiken */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 text-blue-600">
            <MapPin className="w-5 h-5" />
            <span className="font-medium">Aktive Baustellen</span>
          </div>
          <div className="text-2xl font-bold text-blue-800 mt-1">
            {events.filter(e => e.type === 'project').length}
          </div>
        </div>
        
        <div className="p-4 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2 text-green-600">
            <User className="w-5 h-5" />
            <span className="font-medium">Meine Aufgaben</span>
          </div>
          <div className="text-2xl font-bold text-green-800 mt-1">
            {events.filter(e => e.type === 'task').length}
          </div>
        </div>
        
        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="flex items-center gap-2 text-purple-600">
            <Clock className="w-5 h-5" />
            <span className="font-medium">Diese Woche</span>
          </div>
          <div className="text-2xl font-bold text-purple-800 mt-1">
            {getWeekDays().reduce((count, day) => count + getEventsForDay(day).length, 0)}
          </div>
        </div>
      </div>
    </div>
  )
} 