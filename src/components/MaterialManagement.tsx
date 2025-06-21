'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface Material {
  id: string
  name: string
  description: string
  quantity: number
  unit: string
  cost_per_unit: number
  total_cost: number
  supplier: string
  created_at: string
}

interface MaterialManagementProps {
  projectId: string
}

export default function MaterialManagement({ projectId }: MaterialManagementProps) {
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    description: '',
    quantity: '',
    unit: '',
    cost_per_unit: '',
    supplier: ''
  })

  const fetchMaterials = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMaterials(data || [])
    } catch (error) {
      console.error('Fehler beim Laden der Materialien:', error)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    if (projectId) {
      fetchMaterials()
    }
  }, [projectId, fetchMaterials])

  async function addMaterial() {
    if (!newMaterial.name.trim() || !newMaterial.quantity || !newMaterial.cost_per_unit) return

    const quantity = parseFloat(newMaterial.quantity)
    const costPerUnit = parseFloat(newMaterial.cost_per_unit)
    const totalCost = quantity * costPerUnit

    try {
      const { error } = await supabase
        .from('materials')
        .insert([{
          project_id: projectId,
          name: newMaterial.name,
          description: newMaterial.description,
          quantity,
          unit: newMaterial.unit,
          cost_per_unit: costPerUnit,
          total_cost: totalCost,
          supplier: newMaterial.supplier
        }])

      if (error) throw error

      setNewMaterial({
        name: '',
        description: '',
        quantity: '',
        unit: '',
        cost_per_unit: '',
        supplier: ''
      })
      fetchMaterials()
    } catch (error) {
      console.error('Fehler beim Erstellen des Materials:', error)
    }
  }

  const totalCost = materials.reduce((sum, material) => sum + material.total_cost, 0)

  if (loading) {
    return <div className="text-center py-8">Lade Materialien...</div>
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Materialverwaltung</h2>
        <div className="text-right">
          <p className="text-sm text-gray-600">Gesamtkosten</p>
          <p className="text-2xl font-bold text-green-600">
            {totalCost.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Neues Material */}
        <div>
          <h3 className="text-lg font-medium mb-4">Neues Material hinzufügen</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Materialname
              </label>
              <input
                type="text"
                value={newMaterial.name}
                onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="z.B. Zement, Holz, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Beschreibung
              </label>
              <textarea
                value={newMaterial.description}
                onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                placeholder="Zusätzliche Details"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Menge
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newMaterial.quantity}
                  onChange={(e) => setNewMaterial({ ...newMaterial, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Einheit
                </label>
                <select
                  value={newMaterial.unit}
                  onChange={(e) => setNewMaterial({ ...newMaterial, unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Wählen</option>
                  <option value="kg">kg</option>
                  <option value="m³">m³</option>
                  <option value="m²">m²</option>
                  <option value="Stück">Stück</option>
                  <option value="Liter">Liter</option>
                  <option value="Meter">Meter</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Preis/Einheit
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newMaterial.cost_per_unit}
                  onChange={(e) => setNewMaterial({ ...newMaterial, cost_per_unit: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lieferant
              </label>
              <input
                type="text"
                value={newMaterial.supplier}
                onChange={(e) => setNewMaterial({ ...newMaterial, supplier: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Name des Lieferanten"
              />
            </div>
            <button
              onClick={addMaterial}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Material hinzufügen
            </button>
          </div>
        </div>

        {/* Materialliste */}
        <div>
          <h3 className="text-lg font-medium mb-4">Materialliste ({materials.length})</h3>
          {materials.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Noch keine Materialien vorhanden
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {materials.map((material) => (
                <div key={material.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{material.name}</h4>
                    <span className="text-green-600 font-semibold">
                      {material.total_cost.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>
                  {material.description && (
                    <p className="text-gray-600 text-sm mb-2">{material.description}</p>
                  )}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Menge:</span>
                      <span className="ml-1">{material.quantity} {material.unit}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Preis/Einheit:</span>
                      <span className="ml-1">
                        {material.cost_per_unit.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      </span>
                    </div>
                  </div>
                  {material.supplier && (
                    <p className="text-xs text-gray-500 mt-2">
                      Lieferant: {material.supplier}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 