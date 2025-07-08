'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import FullCalendar from '@fullcalendar/react'
import resourceTimelinePlugin from '@fullcalendar/resource-timeline'
import interactionPlugin from '@fullcalendar/interaction'

interface Employee {
  id: string
  first_name: string
  last_name: string
  initials: string
  color: string
}

interface Appointment {
  id: string
  title: string
  start_time: string
  end_time: string
  color?: string
  projects?: {
    name: string
    color: string
  }
  appointment_employees: {
    employees: Employee
  }[]
}

export default function CalendarPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [employeesRes, appointmentsRes] = await Promise.all([
        fetch('/api/employees/list'),
        fetch('/api/appointments/list')
      ])

      if (employeesRes.ok) setEmployees(await employeesRes.json())
      if (appointmentsRes.ok) setAppointments(await appointmentsRes.json())
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calendarResources = employees.map(employee => ({
    id: employee.id,
    title: `${employee.first_name} ${employee.last_name}`,
    color: employee.color
  }))

  const calendarEvents = appointments.flatMap(appointment => 
    appointment.appointment_employees.map(ae => ({
      id: `${appointment.id}-${ae.employees.id}`,
      resourceId: ae.employees.id,
      title: appointment.title,
      start: appointment.start_time,
      end: appointment.end_time,
      backgroundColor: appointment.color || appointment.projects?.color || '#3B82F6',
      borderColor: appointment.color || appointment.projects?.color || '#3B82F6',
      extendedProps: {
        appointmentId: appointment.id,
        projectName: appointment.projects?.name
      }
    }))
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Kalender wird geladen...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/app/appointments"
                className="text-slate-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold text-slate-900">Kalender</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/app/appointments"
                className="text-slate-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Listansicht
              </Link>
              <Link
                href="/app/appointments/create"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Neuer Termin
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Calendar */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <FullCalendar
            plugins={[resourceTimelinePlugin, interactionPlugin]}
            initialView="resourceTimelineWeek"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'resourceTimelineWeek,resourceTimelineDay'
            }}
            resources={calendarResources}
            events={calendarEvents}
            height="auto"
            slotMinTime="06:00:00"
            slotMaxTime="20:00:00"
            slotDuration="01:00:00"
            slotLabelInterval="01:00:00"
            resourceAreaHeaderContent="Mitarbeiter"
            resourceAreaWidth="200px"
            locale="de"
            buttonText={{
              today: 'Heute',
              week: 'Woche',
              day: 'Tag'
            }}
            eventClick={(info) => {
              const appointmentId = info.event.extendedProps.appointmentId
              window.location.href = `/app/appointments/${appointmentId}`
            }}
            eventContent={(arg) => {
              return {
                html: `
                  <div class="px-2 py-1 text-white text-sm font-medium truncate">
                    ${arg.event.title}
                    ${arg.event.extendedProps.projectName ? `<br><span class="opacity-75 text-xs">${arg.event.extendedProps.projectName}</span>` : ''}
                  </div>
                `
              }
            }}
          />
        </div>

        {/* Legend */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Mitarbeiter</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {employees.map(employee => (
              <div key={employee.id} className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: employee.color }}
                ></div>
                <span className="text-sm text-slate-700">
                  {employee.first_name} {employee.last_name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
} 