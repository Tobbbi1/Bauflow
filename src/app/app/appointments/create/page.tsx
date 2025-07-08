'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Clock, MapPin, Users, Package, Save } from 'lucide-react'

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
  address?: string
  contact_person?: string
  contact_phone?: string
  contact_email?: string
}

interface Project {
  id: string
  name: string
  customer_id?: string
  description?: string
  address?: string
  color: string
  customers?: Customer
}

interface Material {
  id: string
  name: string
  description?: string
  unit?: string
  price_per_unit?: number
}

export default function CreateAppointmentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [materials, setMaterials] = useState<Material[]>([])

  const [formData, setFormData] = useState({
    title: '',
    project_id: '',
    customer_id: '',
    description: '',
    location: '',
    start_time: '',
    end_time: '',
    status: 'geplant',
    color: '#3B82F6'
  })

  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [selectedMaterials, setSelectedMaterials] = useState<{ material_id: string; quantity: number }[]>([])

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      const [employeesRes, customersRes, projectsRes, materialsRes] = await Promise.all([
        fetch('/api/employees/list'),
        fetch('/api/customers/list'),
        fetch('/api/projects/list'),
        fetch('/api/materials/list')
      ])

      if (employeesRes.ok) setEmployees(await employeesRes.json())
      if (customersRes.ok) setCustomers(await customersRes.json())
      if (projectsRes.ok) setProjects(await projectsRes.json())
      if (materialsRes.ok) setMaterials(await materialsRes.json())
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const appointmentData = {
        ...formData,
        employee_ids: selectedEmployees,
        materials: selectedMaterials
      }

      const response = await fetch('/api/appointments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appointmentData)
      })

      if (response.ok) {
        router.push('/app/appointments')
      } else {
        console.error('Error creating appointment')
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProjectChange = (projectId: string) => {
    const project = projects.find(p => p.id === projectId)
    setFormData(prev => ({
      ...prev,
      project_id: projectId,
      customer_id: project?.customer_id || '',
      color: project?.color || '#3B82F6',
      location: project?.address || ''
    }))
  }

  const addMaterial = () => {
    setSelectedMaterials(prev => [...prev, { material_id: '', quantity: 1 }])
  }

  const updateMaterial = (index: number, field: string, value: string | number) => {
    setSelectedMaterials(prev => 
      prev.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    )
  }

  const removeMaterial = (index: number) => {
    setSelectedMaterials(prev => prev.filter((_, i) => i !== index))
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
              <h1 className="text-2xl font-bold text-slate-900">Neuer Termin</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Grundinformationen
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Titel *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="z.B. Fliesen verlegen"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="geplant">Geplant</option>
                  <option value="erledigt">Erledigt</option>
                  <option value="dokumentiert">Dokumentiert</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Projekt
                </label>
                <select
                  value={formData.project_id}
                  onChange={(e) => handleProjectChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Projekt auswählen</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name} {project.customers && `(${project.customers.name})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Kunde
                </label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Kunde auswählen</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Beschreibung
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Zusätzliche Details zum Termin..."
                />
              </div>
            </div>
          </div>

          {/* Time and Location */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Zeit & Ort
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Startzeit *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Endzeit *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Ort
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Adresse oder Beschreibung des Orts"
                />
              </div>
            </div>
          </div>

          {/* Employee Assignment */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Mitarbeiter zuweisen
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {employees.map(employee => (
                <label key={employee.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedEmployees.includes(employee.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedEmployees(prev => [...prev, employee.id])
                      } else {
                        setSelectedEmployees(prev => prev.filter(id => id !== employee.id))
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                  />
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: employee.color }}
                  >
                    {employee.initials}
                  </div>
                  <span className="text-sm font-medium text-slate-900">
                    {employee.first_name} {employee.last_name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Material Assignment */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Materialien zuweisen
              </h2>
              <button
                type="button"
                onClick={addMaterial}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors"
              >
                Material hinzufügen
              </button>
            </div>

            <div className="space-y-3">
              {selectedMaterials.map((materialItem, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg">
                  <select
                    value={materialItem.material_id}
                    onChange={(e) => updateMaterial(index, 'material_id', e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Material auswählen</option>
                    {materials.map(material => (
                      <option key={material.id} value={material.id}>
                        {material.name} {material.unit && `(${material.unit})`}
                      </option>
                    ))}
                  </select>
                  
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={materialItem.quantity}
                    onChange={(e) => updateMaterial(index, 'quantity', parseFloat(e.target.value))}
                    className="w-24 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Menge"
                  />
                  
                  <button
                    type="button"
                    onClick={() => removeMaterial(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Entfernen
                  </button>
                </div>
              ))}

              {selectedMaterials.length === 0 && (
                <p className="text-slate-500 text-center py-4">
                  Keine Materialien ausgewählt
                </p>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link
              href="/app/appointments"
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Abbrechen
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Wird erstellt...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Termin erstellen
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
} 