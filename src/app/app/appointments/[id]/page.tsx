'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Clock, MapPin, Users, Package, Edit, Trash2 } from 'lucide-react'

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

interface Material {
  id: string
  name: string
  unit?: string
  price_per_unit?: number
  quantity?: number
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
  appointment_materials: {
    quantity: number
    materials: Material
  }[]
}

export default function AppointmentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [loading, setLoading] = useState(true)
  const [availableEmployees, setAvailableEmployees] = useState<Employee[]>([])
  const [availableMaterials, setAvailableMaterials] = useState<Material[]>([])

  useEffect(() => {
    if (params.id) {
      fetchAppointment()
      fetchAvailableData()
    }
  }, [params.id])

  const fetchAppointment = async () => {
    try {
      const response = await fetch('/api/appointments/list')
      if (response.ok) {
        const appointments = await response.json()
        const found = appointments.find((a: Appointment) => a.id === params.id)
        setAppointment(found || null)
      }
    } catch (error) {
      console.error('Error fetching appointment:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableData = async () => {
    try {
      const [employeesRes, materialsRes] = await Promise.all([
        fetch('/api/employees/list'),
        fetch('/api/materials/list')
      ])

      if (employeesRes.ok) setAvailableEmployees(await employeesRes.json())
      if (materialsRes.ok) setAvailableMaterials(await materialsRes.json())
    } catch (error) {
      console.error('Error fetching available data:', error)
    }
  }

  const updateStatus = async (status: string) => {
    if (!appointment) return

    try {
      const response = await fetch('/api/appointments/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: appointment.id, status })
      })

      if (response.ok) {
        setAppointment(prev => prev ? { ...prev, status: status as any } : null)
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const deleteAppointment = async () => {
    if (!appointment || !confirm('Möchten Sie diesen Termin wirklich löschen?')) return

    try {
      const response = await fetch(`/api/appointments/delete?id=${appointment.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/app/appointments')
      }
    } catch (error) {
      console.error('Error deleting appointment:', error)
    }
  }

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      geplant: 'bg-blue-100 text-blue-800',
      erledigt: 'bg-green-100 text-green-800',
      dokumentiert: 'bg-gray-100 text-gray-800'
    }
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Termin wird geladen...</p>
        </div>
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Termin nicht gefunden</h2>
          <p className="text-slate-600 mb-6">Der angeforderte Termin existiert nicht oder wurde gelöscht.</p>
          <Link
            href="/app/appointments"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Zurück zu den Terminen
          </Link>
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
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: appointment.color || appointment.projects?.color || '#3B82F6' }}
                ></div>
                <h1 className="text-2xl font-bold text-slate-900">{appointment.title}</h1>
                {getStatusBadge(appointment.status)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={deleteAppointment}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Termin löschen"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Termindetails
              </h2>

              <div className="space-y-4">
                {appointment.description && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Beschreibung</p>
                    <p className="text-slate-600">{appointment.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Startzeit</p>
                      <p className="text-slate-600">{formatDateTime(appointment.start_time)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Endzeit</p>
                      <p className="text-slate-600">{formatDateTime(appointment.end_time)}</p>
                    </div>
                  </div>
                </div>

                {appointment.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-700">Ort</p>
                      <p className="text-slate-600">{appointment.location}</p>
                    </div>
                  </div>
                )}

                {appointment.projects && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Projekt</p>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: appointment.projects.color }}
                      ></div>
                      <span className="text-slate-600">{appointment.projects.name}</span>
                    </div>
                  </div>
                )}

                {appointment.customers && (
                  <div>
                    <p className="text-sm font-medium text-slate-700 mb-1">Kunde</p>
                    <div className="text-slate-600">
                      <p>{appointment.customers.name}</p>
                      {appointment.customers.contact_person && (
                        <p className="text-sm">Ansprechpartner: {appointment.customers.contact_person}</p>
                      )}
                      {appointment.customers.contact_phone && (
                        <p className="text-sm">Tel: {appointment.customers.contact_phone}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Assigned Employees */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Zugewiesene Mitarbeiter ({appointment.appointment_employees.length})
              </h2>

              {appointment.appointment_employees.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {appointment.appointment_employees.map(({ employees }) => (
                    <div key={employees.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                        style={{ backgroundColor: employees.color }}
                      >
                        {employees.initials}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {employees.first_name} {employees.last_name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-4">
                  Keine Mitarbeiter zugewiesen
                </p>
              )}
            </div>

            {/* Materials */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Materialien ({appointment.appointment_materials.length})
              </h2>

              {appointment.appointment_materials.length > 0 ? (
                <div className="space-y-3">
                  {appointment.appointment_materials.map(({ materials, quantity }, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                      <div>
                        <p className="font-medium text-slate-900">{materials.name}</p>
                        {materials.unit && (
                          <p className="text-sm text-slate-600">Einheit: {materials.unit}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-slate-900">{quantity} {materials.unit}</p>
                        {materials.price_per_unit && (
                          <p className="text-sm text-slate-600">
                            {(materials.price_per_unit * quantity).toFixed(2)} €
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-4">
                  Keine Materialien zugewiesen
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Actions */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Status ändern</h3>
              <div className="space-y-2">
                {appointment.status === 'geplant' && (
                  <button
                    onClick={() => updateStatus('erledigt')}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Als erledigt markieren
                  </button>
                )}
                {appointment.status === 'erledigt' && (
                  <button
                    onClick={() => updateStatus('dokumentiert')}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Dokumentieren
                  </button>
                )}
                {appointment.status !== 'geplant' && (
                  <button
                    onClick={() => updateStatus('geplant')}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Zurück zu geplant
                  </button>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Übersicht</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Dauer</span>
                  <span className="font-medium">
                    {Math.round((new Date(appointment.end_time).getTime() - new Date(appointment.start_time).getTime()) / (1000 * 60 * 60))} Stunden
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Mitarbeiter</span>
                  <span className="font-medium">{appointment.appointment_employees.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Materialien</span>
                  <span className="font-medium">{appointment.appointment_materials.length}</span>
                </div>
                {appointment.appointment_materials.length > 0 && (
                  <div className="flex justify-between pt-2 border-t border-slate-200">
                    <span className="text-slate-600">Materialkosten</span>
                    <span className="font-medium">
                      {appointment.appointment_materials.reduce((sum, { materials, quantity }) => 
                        sum + (materials.price_per_unit || 0) * quantity, 0
                      ).toFixed(2)} €
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 