'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Users, UserPlus, Package } from 'lucide-react'

interface Employee {
  id: string
  first_name: string
  last_name: string
  initials: string
  color: string
  role: string
  phone?: string
  email?: string
  hourly_rate: number
}

interface Customer {
  id: string
  name: string
  address?: string
  contact_person?: string
  contact_phone?: string
  contact_email?: string
}

interface Material {
  id: string
  name: string
  description?: string
  unit?: string
  price_per_unit?: number
  supplier?: string
  stock_quantity?: number
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('employees')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [employeesRes, customersRes, materialsRes] = await Promise.all([
        fetch('/api/employees/list'),
        fetch('/api/customers/list'),
        fetch('/api/materials/list')
      ])

      if (employeesRes.ok) setEmployees(await employeesRes.json())
      if (customersRes.ok) setCustomers(await customersRes.json())
      if (materialsRes.ok) setMaterials(await materialsRes.json())
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteItem = async (type: string, id: string) => {
    if (!confirm('Möchten Sie diesen Eintrag wirklich löschen?')) return

    try {
      const response = await fetch(`/api/${type}/delete?id=${id}`, { method: 'DELETE' })
      if (response.ok) {
        fetchData()
      }
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  const tabs = [
    { id: 'employees', label: 'Mitarbeiter', icon: Users, count: employees.length },
    { id: 'customers', label: 'Kunden', icon: UserPlus, count: customers.length },
    { id: 'materials', label: 'Materialien', icon: Package, count: materials.length }
  ]

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Einstellungen werden geladen...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Einstellungen</h1>
        <p className="text-slate-600">Verwalten Sie Mitarbeiter, Kunden und Materialien</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6">
        <div className="border-b border-slate-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-xs">
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Employees Tab */}
          {activeTab === 'employees' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-900">Mitarbeiter verwalten</h2>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Mitarbeiter hinzufügen
                </button>
              </div>

              {employees.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Keine Mitarbeiter</h3>
                  <p className="text-slate-600">Fügen Sie Ihren ersten Mitarbeiter hinzu.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {employees.map((employee) => (
                    <div key={employee.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                          style={{ backgroundColor: employee.color }}
                        >
                          {employee.initials}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">
                            {employee.first_name} {employee.last_name}
                          </p>
                          <p className="text-sm text-slate-600 capitalize">{employee.role}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-1 text-sm text-slate-600 mb-3">
                        {employee.phone && <p>📞 {employee.phone}</p>}
                        {employee.email && <p>✉️ {employee.email}</p>}
                        <p>💰 {employee.hourly_rate}€/h</p>
                      </div>

                      <div className="flex gap-2">
                        <button className="flex-1 px-3 py-1 text-slate-600 hover:bg-slate-100 rounded-md text-sm transition-colors">
                          <Edit className="w-4 h-4 inline mr-1" />
                          Bearbeiten
                        </button>
                        <button 
                          onClick={() => deleteItem('employees', employee.id)}
                          className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-md text-sm transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Customers Tab */}
          {activeTab === 'customers' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-900">Kunden verwalten</h2>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Kunde hinzufügen
                </button>
              </div>

              {customers.length === 0 ? (
                <div className="text-center py-12">
                  <UserPlus className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Keine Kunden</h3>
                  <p className="text-slate-600">Fügen Sie Ihren ersten Kunden hinzu.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {customers.map((customer) => (
                    <div key={customer.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-900 mb-1">{customer.name}</h3>
                          {customer.address && <p className="text-sm text-slate-600 mb-1">{customer.address}</p>}
                          {customer.contact_person && (
                            <p className="text-sm text-slate-600">
                              Ansprechpartner: {customer.contact_person}
                            </p>
                          )}
                          {customer.contact_phone && (
                            <p className="text-sm text-slate-600">Tel: {customer.contact_phone}</p>
                          )}
                          {customer.contact_email && (
                            <p className="text-sm text-slate-600">E-Mail: {customer.contact_email}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button className="px-3 py-1 text-slate-600 hover:bg-slate-100 rounded-md text-sm transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteItem('customers', customer.id)}
                            className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-md text-sm transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Materials Tab */}
          {activeTab === 'materials' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-slate-900">Materialien verwalten</h2>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Material hinzufügen
                </button>
              </div>

              {materials.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Keine Materialien</h3>
                  <p className="text-slate-600">Fügen Sie Ihr erstes Material hinzu.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {materials.map((material) => (
                    <div key={material.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-900 mb-1">{material.name}</h3>
                          {material.description && (
                            <p className="text-sm text-slate-600 mb-1">{material.description}</p>
                          )}
                          <div className="flex gap-4 text-sm text-slate-600">
                            {material.unit && <span>Einheit: {material.unit}</span>}
                            {material.price_per_unit && (
                              <span>Preis: {material.price_per_unit.toFixed(2)} €/{material.unit}</span>
                            )}
                            {material.supplier && <span>Lieferant: {material.supplier}</span>}
                          </div>
                          {material.stock_quantity !== undefined && (
                            <p className="text-sm text-slate-600 mt-1">
                              Lager: {material.stock_quantity} {material.unit}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button className="px-3 py-1 text-slate-600 hover:bg-slate-100 rounded-md text-sm transition-colors">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteItem('materials', material.id)}
                            className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-md text-sm transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 