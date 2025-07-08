'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Filter, Calendar as CalendarIcon } from 'lucide-react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

interface Appointment {
  id: string
  title: string
  start_time: string
  end_time: string
  color?: string
  description?: string
  projects?: {
    name: string
    color: string
  }
  customers?: {
    name: string
  }
  appointment_employees: {
    employees: {
      first_name: string
      last_name: string
      initials: string
      color: string
    }
  }[]
}

export default function CalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('timeGridWeek')

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      console.log('Fetching appointments...')
      const response = await fetch('/api/appointments/list')
      console.log('Response status:', response.status)
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched appointments:', data)
        setAppointments(data)
      } else {
        console.error('Failed to fetch appointments:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const calendarEvents = appointments.map(appointment => ({
    id: appointment.id,
    title: appointment.title,
    start: appointment.start_time,
    end: appointment.end_time,
    backgroundColor: appointment.color || appointment.projects?.color || '#3B82F6',
    borderColor: appointment.color || appointment.projects?.color || '#3B82F6',
    extendedProps: {
      description: appointment.description,
      projectName: appointment.projects?.name,
      customerName: appointment.customers?.name,
      employees: appointment.appointment_employees.map(ae => ae.employees)
    }
  }))

  console.log('Calendar Events:', calendarEvents)

  // Get the earliest appointment date or today
  const getInitialDate = () => {
    if (appointments.length === 0) return new Date()
    const firstAppointment = appointments.reduce((earliest, current) => {
      return new Date(current.start_time) < new Date(earliest.start_time) ? current : earliest
    })
    return new Date(firstAppointment.start_time)
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Kalender wird geladen...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Kalender</h1>
          <p className="text-slate-600">Überblick über alle Termine und Baustellen</p>
          <p className="text-sm text-slate-500">Gefundene Termine: {appointments.length}</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={view}
            onChange={(e) => setView(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="dayGridMonth">Monat</option>
            <option value="timeGridWeek">Woche</option>
            <option value="timeGridDay">Tag</option>
          </select>
          <Link
            href="/app/projects/create"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Neue Baustelle
          </Link>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <FullCalendar
          key={`calendar-${view}-${appointments.length}`}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={view}
          initialDate={getInitialDate()}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={calendarEvents}
          height="auto"
          slotMinTime="06:00:00"
          slotMaxTime="20:00:00"
          locale="de"
          buttonText={{
            today: 'Heute',
            month: 'Monat',
            week: 'Woche',
            day: 'Tag'
          }}
          eventClick={(info) => {
            console.log('Appointment clicked:', info.event.extendedProps)
          }}
          eventContent={(arg) => {
            const employees = arg.event.extendedProps.employees || []
            const employeeInitials = employees.map((emp: any) => emp.initials).join(', ')
            
            return {
              html: `
                <div class="p-2 text-white">
                  <div class="font-medium text-sm">${arg.event.title}</div>
                  ${arg.event.extendedProps.projectName ? `<div class="text-xs opacity-75">${arg.event.extendedProps.projectName}</div>` : ''}
                  ${employeeInitials ? `<div class="text-xs opacity-75">👥 ${employeeInitials}</div>` : ''}
                </div>
              `
            }
          }}
          dayMaxEvents={3}
          moreLinkText="weitere"
          eventDidMount={(info) => {
            console.log('Event mounted:', info.event.title, info.event.start, info.event.end)
          }}
        />
      </div>

      {/* Legend */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Colors */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Baustellen</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-purple-500"></div>
              <span className="text-sm text-slate-700">Badezimmer Renovierung</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-cyan-500"></div>
              <span className="text-sm text-slate-700">Büro Umbau</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-pink-500"></div>
              <span className="text-sm text-slate-700">Küche Modernisierung</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Statistiken</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Termine diese Woche</span>
              <span className="font-medium text-slate-900">{appointments.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Aktive Baustellen</span>
              <span className="font-medium text-slate-900">3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Geplante Stunden</span>
              <span className="font-medium text-slate-900">42h</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 