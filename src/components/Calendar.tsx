'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Loader2
} from 'lucide-react'

interface CalendarEvent {
  id: string
  title: string
  description?: string
  start_date: string
  end_date: string
  start_time?: string
  end_time?: string
  color: string
  type: 'project' | 'task'
  project_name?: string
  assigned_to_name?: string
  status?: string
  priority?: string
}

interface Profile {
  company_id: string
}

export default function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [hoveredEvent, setHoveredEvent] = useState<CalendarEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>('')
  const supabase = createClientComponentClient()

  const loadTestData = async () => {
    try {
      const response = await fetch('/api/test-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        setDebugInfo('Test-Daten erfolgreich geladen! Seite wird neu geladen...')
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        const error = await response.json()
        setDebugInfo(`Fehler: ${error.error}`)
      }
    } catch (error) {
      setDebugInfo('Fehler beim Laden der Test-Daten')
    }
  }

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true)
      setDebugInfo('Starte Datenabfrage...')
      
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setDebugInfo(`Benutzer gefunden: ${user.email}`)
        
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single()
        
        if (profileError) {
          setDebugInfo(`Profil-Fehler: ${profileError.message}`)
          setLoading(false)
          return
        } 
        
        setProfile(profileData)
        setDebugInfo(`Company ID: ${profileData.company_id}`)
        
        // Baustellen laden
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('id, name, color, start_date, end_date, description')
          .eq('company_id', profileData.company_id)
          .not('start_date', 'is', null)
          .not('end_date', 'is', null)

        if (projectsError) {
          setDebugInfo(`Projekte-Fehler: ${projectsError.message}`)
        } else {
          setDebugInfo(`Projekte gefunden: ${projectsData?.length || 0}`)
        }

        // Aufgaben laden
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select(`
            id, title, description, start_date, end_date, start_time, end_time, color, status, priority,
            projects!inner(name),
            profiles!assigned_to(first_name, last_name)
          `)
          .eq('projects.company_id', profileData.company_id)
          .not('start_date', 'is', null)
          .not('end_date', 'is', null)

        if (tasksError) {
          setDebugInfo(`Aufgaben-Fehler: ${tasksError.message}`)
        } else {
          setDebugInfo(`Aufgaben gefunden: ${tasksData?.length || 0}`)
        }

        const allEvents: CalendarEvent[] = []

        // Baustellen als Events hinzufügen
        if (!projectsError && projectsData) {
          projectsData.forEach(project => {
            if (project.start_date && project.end_date) {
              allEvents.push({
                id: project.id,
                title: project.name,
                description: project.description,
                start_date: project.start_date,
                end_date: project.end_date,
                color: project.color || '#3B82F6',
                type: 'project'
              })
            }
          })
        }

        // Aufgaben als Events hinzufügen
        if (!tasksError && tasksData) {
          tasksData.forEach((task: any) => {
            if (task.start_date && task.end_date) {
              allEvents.push({
                id: task.id,
                title: task.title,
                description: task.description,
                start_date: task.start_date,
                end_date: task.end_date,
                start_time: task.start_time,
                end_time: task.end_time,
                color: task.color || '#10B981',
                type: 'task',
                project_name: task.projects?.name,
                assigned_to_name: task.profiles ? `${task.profiles.first_name} ${task.profiles.last_name}` : 'Nicht zugewiesen',
                status: task.status,
                priority: task.priority
              })
            }
          })
        }

        setDebugInfo(`Gesamte Events: ${allEvents.length}`)
        setEvents(allEvents)
      } else {
        setDebugInfo('Kein Benutzer gefunden')
      }
      setLoading(false)
    }

    fetchEvents()
  }, [supabase])

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const current = new Date(startDate)
    
    while (current <= lastDay || current.getDay() !== 0) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }
    
    return days
  }

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return events.filter(event => {
      const eventStart = new Date(event.start_date)
      const eventEnd = new Date(event.end_date)
      const currentDate = new Date(dateStr)
      return currentDate >= eventStart && currentDate <= eventEnd
    })
  }

  const getEventPosition = (event: CalendarEvent, date: Date) => {
    const eventStart = new Date(event.start_date)
    const eventEnd = new Date(event.end_date)
    const currentDate = new Date(date)
    
    // Berechne die Gesamtdauer des Events in Tagen
    const totalDays = Math.ceil((eventEnd.getTime() - eventStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    // Berechne, an welchem Tag im Event wir uns befinden
    const dayInEvent = Math.ceil((currentDate.getTime() - eventStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    // Wenn es der erste Tag des Events ist, zeige es von Anfang an
    if (dayInEvent === 1) {
      return {
        width: `${(1 / totalDays) * 100}%`,
        left: '0%'
      }
    }
    
    // Ansonsten verstecke das Event (es wird an anderen Tagen angezeigt)
    return {
      width: '0%',
      left: '0%'
    }
  }

  const formatTime = (time: string) => {
    if (!time) return ''
    return time.substring(0, 5)
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Abgeschlossen'
      case 'in_progress': return 'In Bearbeitung'
      case 'pending': return 'Ausstehend'
      case 'cancelled': return 'Abgebrochen'
      default: return status
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Dringend'
      case 'high': return 'Hoch'
      case 'medium': return 'Mittel'
      case 'low': return 'Niedrig'
      default: return priority
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  const days = getDaysInMonth(currentDate)
  const weekDays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ]

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <CalendarIcon /> Kalender
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-semibold text-slate-800">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Debug Info */}
      {debugInfo && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">{debugInfo}</p>
        </div>
      )}

      {/* Test-Daten Button */}
      <div className="mb-4">
        <button
          onClick={loadTestData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          Test-Daten laden
        </button>
      </div>

      {/* Kalender Grid */}
      <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden">
        {/* Wochentage Header */}
        {weekDays.map(day => (
          <div key={day} className="bg-slate-50 p-3 text-center text-sm font-medium text-slate-600">
            {day}
          </div>
        ))}

        {/* Kalender Tage */}
        {days.map((date, index) => {
          const dayEvents = getEventsForDate(date)
          const isCurrentMonthDay = isCurrentMonth(date)
          const isTodayDate = isToday(date)

          return (
            <div
              key={index}
              className={`min-h-[120px] bg-white p-2 relative ${
                !isCurrentMonthDay ? 'text-slate-400' : ''
              } ${isTodayDate ? 'bg-blue-50' : ''}`}
            >
              {/* Datum */}
              <div className={`text-sm font-medium mb-1 ${
                isTodayDate ? 'text-blue-600' : isCurrentMonthDay ? 'text-slate-900' : 'text-slate-400'
              }`}>
                {date.getDate()}
              </div>

              {/* Events Container */}
              <div className="relative h-20">
                {dayEvents.map(event => {
                  const eventStart = new Date(event.start_date)
                  const eventEnd = new Date(event.end_date)
                  const currentDate = new Date(date)
                  const isFirstDay = currentDate.getTime() === eventStart.getTime()
                  const isLastDay = currentDate.getTime() === eventEnd.getTime()
                  
                  // Berechne die Breite basierend auf der Gesamtdauer
                  const totalDays = Math.ceil((eventEnd.getTime() - eventStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
                  const dayInEvent = Math.ceil((currentDate.getTime() - eventStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
                  
                  let width = '100%'
                  let left = '0%'
                  
                  if (totalDays > 1) {
                    if (isFirstDay) {
                      // Erster Tag: Zeige von Anfang bis Ende des Tages
                      width = `${(1 / totalDays) * 100}%`
                      left = '0%'
                    } else if (isLastDay) {
                      // Letzter Tag: Zeige von Anfang des Tages bis Ende
                      width = `${(1 / totalDays) * 100}%`
                      left = `${((dayInEvent - 1) / totalDays) * 100}%`
                    } else {
                      // Mittlere Tage: Zeige den ganzen Tag
                      width = `${(1 / totalDays) * 100}%`
                      left = `${((dayInEvent - 1) / totalDays) * 100}%`
                    }
                  }
                  
                  return (
                    <div
                      key={`${event.id}-${date.toDateString()}`}
                      className="absolute h-6 rounded text-xs font-medium text-white cursor-pointer transition-all hover:opacity-80"
                      style={{
                        backgroundColor: event.color,
                        width: width,
                        left: left,
                        top: `${(dayEvents.indexOf(event) * 24)}px`
                      }}
                      onMouseEnter={(e) => {
                        setHoveredEvent(event)
                        // Position des Tooltips basierend auf Mausposition
                        const rect = e.currentTarget.getBoundingClientRect()
                        const tooltip = document.getElementById('event-tooltip')
                        if (tooltip) {
                          tooltip.style.left = `${rect.left}px`
                          tooltip.style.top = `${rect.bottom + 5}px`
                        }
                      }}
                      onMouseLeave={() => setHoveredEvent(null)}
                    >
                      <div className="px-2 py-1 truncate">
                        {isFirstDay ? event.title : ''}
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
      {hoveredEvent && (
        <div 
          id="event-tooltip"
          className="fixed z-50 bg-white border border-slate-200 rounded-lg shadow-lg p-4 max-w-sm"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <div className="flex items-start gap-3">
            <div 
              className="w-4 h-4 rounded-full mt-1 flex-shrink-0" 
              style={{ backgroundColor: hoveredEvent.color }}
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
                  <CalendarIcon className="w-4 h-4" />
                  <span>
                    {new Date(hoveredEvent.start_date).toLocaleDateString()} - {new Date(hoveredEvent.end_date).toLocaleDateString()}
                  </span>
                </div>

                {hoveredEvent.start_time && hoveredEvent.end_time && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>
                      {formatTime(hoveredEvent.start_time)} - {formatTime(hoveredEvent.end_time)}
                    </span>
                  </div>
                )}

                {hoveredEvent.type === 'task' && hoveredEvent.project_name && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{hoveredEvent.project_name}</span>
                  </div>
                )}

                {hoveredEvent.type === 'task' && hoveredEvent.assigned_to_name && (
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>{hoveredEvent.assigned_to_name}</span>
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

      {/* Legende */}
      <div className="mt-6 p-4 bg-slate-50 rounded-lg">
        <h4 className="font-medium text-slate-800 mb-3">Legende</h4>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span className="text-sm text-slate-600">Baustellen</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-sm text-slate-600">Aufgaben</span>
          </div>
        </div>
      </div>
    </div>
  )
} 