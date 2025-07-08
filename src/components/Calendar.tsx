'use client'

import { useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import interactionPlugin from '@fullcalendar/interaction'
import deLocale from '@fullcalendar/core/locales/de'

interface CalendarEvent {
  id: string
  resourceId: string
  title: string
  start: string
  end: string
  color: string
  type: 'project' | 'task' | 'absence'
  description?: string
}

interface Resource {
  id: string
  title: string
  initials: string
  color: string
}

export default function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [info, setInfo] = useState<string | null>(null)
  const [debug, setDebug] = useState<any>(null)
  const [rawData, setRawData] = useState<any>(null)

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true)
      setInfo(null)
      setDebug(null)
      setRawData(null)
      try {
        // Mitarbeiter (profiles)
        const profilesRes = await fetch('/api/employees/list')
        const profilesJson = await profilesRes.json()
        // Projekte
        const projectsRes = await fetch('/api/projects/list')
        const projectsJson = await projectsRes.json()
        // Aufgaben
        const tasksRes = await fetch('/api/tasks/list')
        const tasksJson = await tasksRes.json()
        // Abwesenheiten
        const absencesRes = await fetch('/api/employee-absences/list')
        const absencesJson = await absencesRes.json()
        setRawData({ profiles: profilesJson, projects: projectsJson, tasks: tasksJson, absences: absencesJson })
        // Ressourcen (Mitarbeiter)
        const resourceList = (profilesJson.data || []).map((p: any) => ({
          id: p.id,
          title: `${p.first_name} ${p.last_name}`,
          initials: (p.first_name?.[0] || '') + (p.last_name?.[0] || ''),
          color: p.color || '#64748B'
        }))
        setResources(resourceList)
        // Events
        const projectEvents = (projectsJson.data || []).map((p: any) => ({
          id: 'project-' + p.id,
          resourceId: p.created_by,
          title: p.name,
          start: p.start_date,
          end: p.end_date,
          color: p.color || '#3B82F6',
          type: 'project',
          description: p.description
        }))
        const taskEvents = (tasksJson.data || []).map((t: any) => ({
          id: 'task-' + t.id,
          resourceId: t.assigned_to,
          title: t.title,
          start: t.start_date,
          end: t.end_date,
          color: t.color || '#10B981',
          type: 'task',
          description: t.description
        }))
        const absenceEvents = (absencesJson.data || []).map((a: any) => ({
          id: 'absence-' + a.id,
          resourceId: a.user_id,
          title: a.type === 'Urlaub' ? 'Urlaub' : a.type,
          start: a.start_date,
          end: a.end_date,
          color: '#F59E42',
          type: 'absence',
          description: a.description
        }))
        const allEvents = [...projectEvents, ...taskEvents, ...absenceEvents]
        setEvents(allEvents)
        setDebug({
          resources: resourceList.length,
          projects: projectEvents.length,
          tasks: taskEvents.length,
          absences: absenceEvents.length,
          allEvents
        })
        if (allEvents.length === 0) {
          setInfo('Keine Termine gefunden. Lege Projekte, Aufgaben oder Abwesenheiten an!')
        }
      } catch (error) {
        setInfo('Fehler beim Laden der Kalenderdaten.')
        setEvents([])
        setResources([])
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      {/* Debug-Ausgabe für Rohdaten */}
      {rawData && (
        <details className="mb-4 p-3 bg-yellow-50 rounded-lg text-xs text-yellow-900 overflow-x-auto">
          <summary className="cursor-pointer font-bold">Debug: Rohdaten anzeigen</summary>
          <pre>{JSON.stringify(rawData, null, 2)}</pre>
        </details>
      )}
      {/* Debug-Ausgabe für Events */}
      {debug && (
        <details className="mb-4 p-3 bg-yellow-50 rounded-lg text-xs text-yellow-900 overflow-x-auto">
          <summary className="cursor-pointer font-bold">Debug: Events anzeigen</summary>
          <pre>{JSON.stringify(debug, null, 2)}</pre>
        </details>
      )}
      <h2 className="text-3xl font-bold text-slate-800 mb-6">Kalender</h2>
      {loading ? (
        <div className="flex justify-center items-center p-8">
          <span className="ml-2">Lade Kalender...</span>
        </div>
      ) : (
        <>
          {info && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg text-blue-800 text-sm text-center">
              {info}
            </div>
          )}
          <FullCalendar
            plugins={[resourceTimelinePlugin, interactionPlugin]}
            initialView="resourceTimelineWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'resourceTimelineDay,resourceTimelineWeek'
            }}
            locale={deLocale}
            resources={resources}
            events={events}
            eventContent={renderEventContent}
            resourceAreaHeaderContent="Mitarbeiter"
            resourceLabelContent={renderResourceLabel}
            height="auto"
            eventDisplay="block"
            dayMaxEvents={3}
            slotMinWidth={120}
            aspectRatio={1.5}
            contentHeight="auto"
          />
        </>
      )}
      <div className="mt-6 p-4 bg-slate-50 rounded-lg">
        <h4 className="font-medium text-slate-800 mb-3">Legende</h4>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded-full bg-blue-600"></span>
            <span className="text-sm text-slate-600">Baustellen</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded-full bg-green-600"></span>
            <span className="text-sm text-slate-600">Aufgaben</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 h-4 rounded-full bg-orange-400"></span>
            <span className="text-sm text-slate-600">Abwesenheiten/Urlaub</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function renderEventContent(eventInfo: any) {
  return (
    <div title={eventInfo.event.title} style={{ color: 'white', background: eventInfo.event.backgroundColor, borderRadius: 6, padding: 2, fontWeight: 500 }}>
      {eventInfo.event.title}
    </div>
  )
}

function renderResourceLabel(resource: any) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-block w-7 h-7 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-xs">
        {resource.resource.extendedProps.initials}
      </span>
      <span className="text-slate-700 text-sm font-medium">{resource.resource.title}</span>
    </div>
  )
} 