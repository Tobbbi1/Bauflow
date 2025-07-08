'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Clock, MapPin, Users, Search, Filter, Plus, ArrowLeft } from 'lucide-react'

interface Employee {
  id: string
  first_name: string
  last_name: string
  initials: string
  color: string
}

interface Customer {
  id: string
  name: string
  contact_person?: string
  contact_phone?: string
}

interface Project {
  id: string
  name: string
  color: string
  customers?: Customer
}

interface Appointment {
  id: string
  title: string
  description?: string
  location?: string
  start_time: string
  end_time: string
  status: 'geplant' | 'erledigt' | 'dokumentiert'
  color?: string
  projects?: Project
  customers?: Customer
  appointment_employees: {
    employees: Employee
  }[]
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments/list')
      if (response.ok) {
        const data = await response.json()
        setAppointments(data)
      }
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateAppointmentStatus = async (id: string, status: string) => {
    try {
      const response = await fetch('/api/appointments/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      })
      
      if (response.ok) {
        fetchAppointments()
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = appointment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.projects?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appointment.customers?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    const styles = {
      geplant: 'bg-blue-100 text-blue-800',
      erledigt: 'bg-green-100 text-green-800',
      dokumentiert: 'bg-gray-100 text-gray-800'
    }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Termine werden geladen...</p>
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
                href="/app"
                className="text-slate-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold text-slate-900">Termine</h1>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/app/appointments/calendar"
                className="text-slate-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Kalenderansicht
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Termine durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Alle Status</option>
                <option value="geplant">Geplant</option>
                <option value="erledigt">Erledigt</option>
                <option value="dokumentiert">Dokumentiert</option>
              </select>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="space-y-4">
          {filteredAppointments.length === 0 ? (
            <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
              <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Keine Termine gefunden</h3>
              <p className="text-slate-600 mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Versuchen Sie andere Suchkriterien.' 
                  : 'Erstellen Sie Ihren ersten Termin.'}
              </p>
              <Link
                href="/app/appointments/create"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Neuer Termin
              </Link>
            </div>
          ) : (
            filteredAppointments.map((appointment) => (
              <div key={appointment.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: appointment.color || appointment.projects?.color || '#3B82F6' }}
                        ></div>
                        <h3 className="text-lg font-semibold text-slate-900">{appointment.title}</h3>
                        {getStatusBadge(appointment.status)}
                      </div>
                      
                      {appointment.projects && (
                        <p className="text-slate-600 mb-1">
                          <strong>Projekt:</strong> {appointment.projects.name}
                        </p>
                      )}
                      
                      {appointment.customers && (
                        <p className="text-slate-600 mb-1">
                          <strong>Kunde:</strong> {appointment.customers.name}
                        </p>
                      )}
                      
                      {appointment.description && (
                        <p className="text-slate-600 mb-3">{appointment.description}</p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {appointment.status === 'geplant' && (
                        <button
                          onClick={() => updateAppointmentStatus(appointment.id, 'erledigt')}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-md text-sm font-medium hover:bg-green-200 transition-colors"
                        >
                          Als erledigt markieren
                        </button>
                      )}
                      {appointment.status === 'erledigt' && (
                        <button
                          onClick={() => updateAppointmentStatus(appointment.id, 'dokumentiert')}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                          Dokumentieren
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="w-4 h-4" />
                      <div>
                        <p className="text-sm font-medium">Zeit</p>
                        <p className="text-sm">
                          {formatDateTime(appointment.start_time)} - {new Date(appointment.end_time).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    {appointment.location && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="w-4 h-4" />
                        <div>
                          <p className="text-sm font-medium">Ort</p>
                          <p className="text-sm">{appointment.location}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-slate-600">
                      <Users className="w-4 h-4" />
                      <div>
                        <p className="text-sm font-medium">Mitarbeiter</p>
                        <div className="flex gap-1">
                          {appointment.appointment_employees.length > 0 ? (
                            appointment.appointment_employees.map((ae) => (
                              <span
                                key={ae.employees.id}
                                className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium text-white"
                                style={{ backgroundColor: ae.employees.color }}
                                title={`${ae.employees.first_name} ${ae.employees.last_name}`}
                              >
                                {ae.employees.initials}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-slate-400">Keine zugewiesen</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <Link
                      href={`/app/appointments/${appointment.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Details anzeigen →
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
} 