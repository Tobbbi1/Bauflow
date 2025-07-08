'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Users, Plus, Edit, Trash2, Phone, Mail } from 'lucide-react'

interface Employee {
  id: string
  first_name: string
  last_name: string
  initials: string
  color: string
  role: string
  created_at: string
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees/list')
      if (response.ok) {
        const data = await response.json()
        setEmployees(data)
      }
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteEmployee = async (id: string) => {
    if (!confirm('Möchten Sie diesen Mitarbeiter wirklich löschen?')) return

    try {
      const response = await fetch(`/api/employees/delete?id=${id}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        fetchEmployees()
      }
    } catch (error) {
      console.error('Error deleting employee:', error)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Mitarbeiter werden geladen...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Mitarbeiter</h1>
          <p className="text-slate-600">Verwalten Sie Ihr Team und deren Informationen</p>
        </div>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Mitarbeiter hinzufügen
        </button>
      </div>

      {employees.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <Users className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Keine Mitarbeiter vorhanden</h3>
          <p className="text-slate-600 mb-6">Fügen Sie Ihren ersten Mitarbeiter hinzu.</p>
          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Ersten Mitarbeiter hinzufügen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((employee) => (
            <div key={employee.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow p-6">
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold"
                  style={{ backgroundColor: employee.color }}
                >
                  {employee.initials}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {employee.first_name} {employee.last_name}
                  </h3>
                  <p className="text-slate-600 capitalize">{employee.role}</p>
                </div>
                <div className="flex gap-1">
                  <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-md">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => deleteEmployee(employee.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-200">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Seit:</span>
                  <span className="text-slate-900">
                    {new Date(employee.created_at).toLocaleDateString('de-DE')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Status:</span>
                  <span className="text-green-600 font-medium">Aktiv</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200">
                <Link
                  href={`/app/timesheets?employee=${employee.id}`}
                  className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors text-center block"
                >
                  Stundenzettel anzeigen
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 