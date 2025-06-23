'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Calendar, Loader2, AlertCircle, Clock, MapPin, User } from 'lucide-react'

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
  start_time?: string
  end_time?: string
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
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, company_id, role, first_name, last_name')
          .eq('id', user.id)
          .single()

        if (profileError) {
          setError('Fehler beim Laden der Benutzerdaten: ' + profileError.message)
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

        // Aufgaben des Mitarbeiters laden
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select(`
            id, title, description, start_date, end_date, start_time, end_time, color, status, priority,
            projects!inner(name),
            profiles!assigned_to(first_name, last_name)
          `)
          .eq('projects.company_id', profileData.company_id)
          .eq('assigned_to', user.id)
          .not('start_date', 'is', null)
          .not('end_date', 'is', null)

        if (projectsError) {
          setError('Fehler beim Laden der Baustellen: ' + projectsError.message)
          setLoading(false)
          return
        }

        if (tasksError) {
          setError('Fehler beim Laden der Aufgaben: ' + tasksError.message)
          setLoading(false)
          return
        }

        const allEvents: CalendarEvent[] = []

        // Baustellen als Events hinzufügen
        if (projectsData) {
          projectsData.forEach(project => {
            allEvents.push({
              id: `project-${project.id}`,
              title: `🏗️ ${project.name}`,
              start: new Date(project.start_date),
              end: new Date(project.end_date),
              color: project.color,
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
              title: `✅ ${task.title}`,
              start: new Date(task.start_date),
              end: new Date(task.end_date),
              color: task.color || '#10B981',
              type: 'task',
              description: task.description,
              project_name: task.projects?.name,
              assigned_to: `${task.profiles?.first_name} ${task.profiles?.last_name}`,
              start_time: task.start_time,
              end_time: task.end_time
            })
          })
        }

        setEvents(allEvents)
      }
      setLoading(false)
    }

    fetchEvents()
  }, [supabase])

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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  }

  const getEventTooltip = (event: CalendarEvent) => {
    let tooltip = event.title
    if (event.description) {
      tooltip += `\n\n${event.description}`
    }
    if (event.project_name) {
      tooltip += `\n\nBaustelle: ${event.project_name}`
    }
    if (event.type === 'task') {
      tooltip += `\n\nZugewiesen an: ${event.assigned_to}`
    }
    return tooltip
  }

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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Calendar /> Mein Kalender
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={previousWeek}
            className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          >
            ← Vorherige Woche
          </button>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Heute
          </button>
          <button
            onClick={nextWeek}
            className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          >
            Nächste Woche →
          </button>
        </div>
      </div>

      <div className="mb-4">
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
          <div key={day} className="p-2 text-center text-sm font-medium text-slate-500 bg-slate-50 rounded-md">
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
                {dayEvents.map(event => (
                  <div
                    key={event.id}
                    className="text-xs p-1 rounded cursor-pointer transition-all hover:scale-105"
                    style={{ backgroundColor: event.color + '20', borderLeft: `3px solid ${event.color}` }}
                    title={getEventTooltip(event)}
                  >
                    <div className="font-medium truncate" style={{ color: event.color }}>
                      {event.title}
                    </div>
                    {event.start_time && event.end_time && (
                      <div className="text-slate-600 text-xs">
                        {formatTime(new Date(`2000-01-01T${event.start_time}`))} - {formatTime(new Date(`2000-01-01T${event.end_time}`))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legende */}
      <div className="mt-6 p-4 bg-slate-50 rounded-lg">
        <h4 className="font-medium text-slate-700 mb-2">Legende:</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600"></div>
            <span>Baustellen</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-600"></div>
            <span>Meine Aufgaben</span>
          </div>
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