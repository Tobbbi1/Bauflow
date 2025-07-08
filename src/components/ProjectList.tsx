'use client'

import { useState, useEffect, FormEvent } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { PlusCircle, Loader2, AlertCircle, Trash2, Edit, HardHat, User, MapPin, Calendar, FileText, ChevronUp, Palette } from 'lucide-react'

interface Baustelle {
  id: string
  name: string
  address: string
  description?: string
  status: string
  contact_person_name: string
  start_date: string
  end_date: string
  color: string
  created_at: string
}

interface Profile {
    company_id: string;
}

export default function BaustellenList() {
  const [baustellen, setBaustellen] = useState<Baustelle[]>([])
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingBaustelle, setEditingBaustelle] = useState<Baustelle | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null);
  const [newBaustelle, setNewBaustelle] = useState({
      name: '',
      address: '',
      description: '',
      contact_person_name: '',
      start_date: '',
      end_date: '',
      color: '#3B82F6'
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  // Vordefinierte Farben für Baustellen
  const colorOptions = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', 
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ]

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
            setError('Fehler beim Laden der Benutzerdaten: ' + profileError.message);
            setLoading(false);
            return;
        } 
        
        setProfile(profileData);
        
        const { data: baustellenData, error: baustellenError } = await supabase
          .from('projects')
          .select('id, name, address, status, contact_person_name, start_date, end_date, color, created_at')
          .order('created_at', { ascending: false })

        if (baustellenError) {
          setError(baustellenError.message)
        } else {
          setBaustellen(baustellenData as Baustelle[])
        }
      }
      setLoading(false)
    }

    fetchInitialData()
  }, [supabase])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      if (isEditMode && editingBaustelle) {
        setEditingBaustelle(prev => prev ? { ...prev, [name]: value } : null)
      } else {
        setNewBaustelle(prev => ({ ...prev, [name]: value }));
      }
  }

  const handleColorChange = (color: string) => {
    if (isEditMode && editingBaustelle) {
      setEditingBaustelle(prev => prev ? { ...prev, color } : null)
    } else {
      setNewBaustelle(prev => ({ ...prev, color }))
    }
  }

  const handleAddBaustelle = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile) {
        setError("Benutzerprofil nicht geladen. Bitte laden Sie die Seite neu.");
        return;
    }
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          setError('Keine gültige Sitzung gefunden. Bitte melden Sie sich erneut an.');
          return;
        }
        const response = await fetch('/api/projects/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            ...newBaustelle,
            company_id: profile.company_id
          }),
        });
        const result = await response.json();
        if (!response.ok) {
          setError(result.error || 'Fehler beim Speichern der Baustelle');
          return;
        }
        setBaustellen([result.data, ...baustellen])
        setNewBaustelle({ name: '', address: '', description: '', contact_person_name: '', start_date: '', end_date: '', color: '#3B82F6' });
        setIsFormVisible(false)
      } catch (apiError) {
        setError('Netzwerkfehler beim Speichern der Baustelle');
      }
    }
  }

  const handleEditBaustelle = async (e: FormEvent) => {
    e.preventDefault()
    if (!editingBaustelle) return

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Keine gültige Sitzung gefunden. Bitte melden Sie sich erneut an.');
        return;
      }

      const response = await fetch('/api/projects/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(editingBaustelle),
      });

      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Fehler beim Aktualisieren der Baustelle');
        return;
      }

      // Baustelle in der Liste aktualisieren
      setBaustellen(prev => prev.map(baustelle => 
        baustelle.id === editingBaustelle.id 
          ? { ...baustelle, ...editingBaustelle }
          : baustelle
      ))

      setEditingBaustelle(null)
      setIsEditMode(false)
      setIsFormVisible(false)
    } catch (apiError) {
      setError('Netzwerkfehler beim Aktualisieren der Baustelle');
    }
  }

  const handleDeleteBaustelle = async (baustelleId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Baustelle löschen möchten? Alle zugehörigen Aufgaben werden ebenfalls gelöscht.')) {
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError('Keine gültige Sitzung gefunden. Bitte melden Sie sich erneut an.');
        return;
      }

      const response = await fetch(`/api/projects/delete?id=${baustelleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const result = await response.json();
        setError(result.error || 'Fehler beim Löschen der Baustelle');
        return;
      }

      // Baustelle aus der Liste entfernen
      setBaustellen(prev => prev.filter(baustelle => baustelle.id !== baustelleId))
    } catch (apiError) {
      setError('Netzwerkfehler beim Löschen der Baustelle');
    }
  }

  const startEditBaustelle = (baustelle: Baustelle) => {
    setEditingBaustelle(baustelle)
    setIsEditMode(true)
    setIsFormVisible(true)
  }

  const cancelEdit = () => {
    setEditingBaustelle(null)
    setIsEditMode(false)
    setIsFormVisible(false)
    setNewBaustelle({ name: '', address: '', description: '', contact_person_name: '', start_date: '', end_date: '', color: '#3B82F6' })
  }

  if (loading) {
    return (
        <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><HardHat /> Baustellen verwalten</h2>
            <button
                onClick={() => {
                  if (isEditMode) {
                    cancelEdit()
                  } else {
                    setIsFormVisible(!isFormVisible)
                  }
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
            >
                {isFormVisible ? <ChevronUp className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
                <span>{isFormVisible ? 'Schließen' : 'Neue Baustelle'}</span>
            </button>
        </div>
      
      {isFormVisible && (
        <form onSubmit={isEditMode ? handleEditBaustelle : handleAddBaustelle} className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200 animate-fade-in-down">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="md:col-span-2">
                    <label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1"><FileText size={16}/>Baustellen-Name</label>
                    <input id="name" name="name" type="text" value={isEditMode && editingBaustelle ? editingBaustelle.name : newBaustelle.name} onChange={handleInputChange} className="input-field" placeholder="z.B. Neubau EFH Meier" required />
                </div>
                <div>
                    <label htmlFor="address" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1"><MapPin size={16}/>Adresse</label>
                    <input id="address" name="address" type="text" value={isEditMode && editingBaustelle ? editingBaustelle.address : newBaustelle.address} onChange={handleInputChange} className="input-field" placeholder="z.B. Hauptstraße 1, 12345 Berlin" required/>
                </div>
                <div>
                    <label htmlFor="contact_person_name" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1"><User size={16}/>Ansprechpartner</label>
                    <input id="contact_person_name" name="contact_person_name" type="text" value={isEditMode && editingBaustelle ? editingBaustelle.contact_person_name : newBaustelle.contact_person_name} onChange={handleInputChange} className="input-field" placeholder="z.B. Herr Schmidt" required/>
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="description" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1"><FileText size={16}/>Was muss gemacht werden?</label>
                    <textarea id="description" name="description" value={(isEditMode && editingBaustelle ? editingBaustelle.description : newBaustelle.description) || ''} onChange={handleInputChange} className="input-field" rows={3} placeholder="z.B. Komplette Badsanierung inkl. Fliesen"></textarea>
                </div>
                <div>
                    <label htmlFor="start_date" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1"><Calendar size={16}/>Start-Datum</label>
                    <input id="start_date" name="start_date" type="date" value={isEditMode && editingBaustelle ? editingBaustelle.start_date : newBaustelle.start_date} onChange={handleInputChange} className="input-field" required/>
                </div>
                <div>
                    <label htmlFor="end_date" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1"><Calendar size={16}/>End-Datum</label>
                    <input id="end_date" name="end_date" type="date" value={isEditMode && editingBaustelle ? editingBaustelle.end_date : newBaustelle.end_date} onChange={handleInputChange} className="input-field" required/>
                </div>
                <div className="md:col-span-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2"><Palette size={16}/>Farbe für Baustelle</label>
                    <div className="flex gap-2 flex-wrap">
                        {colorOptions.map((color) => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => handleColorChange(color)}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${
                                    (isEditMode && editingBaustelle ? editingBaustelle.color : newBaustelle.color) === color
                                        ? 'border-slate-800 scale-110'
                                        : 'border-slate-300 hover:border-slate-500'
                                }`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>
            </div>
            <div className="mt-6 flex gap-3">
                <button type="submit" className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  {isEditMode ? (
                    <>
                      <Edit className="w-5 h-5" />
                      <span>Baustelle aktualisieren</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-5 h-5" />
                      <span>Baustelle anlegen</span>
                    </>
                  )}
                </button>
                {isEditMode && (
                  <button 
                    type="button" 
                    onClick={cancelEdit}
                    className="px-4 py-2 bg-gray-500 text-white font-semibold rounded-lg shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    Abbrechen
                  </button>
                )}
            </div>
            {error && (
                <div className="mt-4 bg-red-50 p-3 rounded-md flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-5 w-5"/>
                    <span>Fehler: {error}</span>
                </div>
            )}
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Baustelle</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Zeitraum</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Aktionen</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {baustellen.map((b) => (
              <tr key={b.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-3" 
                      style={{ backgroundColor: b.color }}
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-900">{b.name}</div>
                      <div className="text-sm text-slate-500">{b.address}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {b.start_date && new Date(b.start_date).toLocaleDateString()} - {b.end_date && new Date(b.end_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={b.status}
                    onChange={async (e) => {
                      const newStatus = e.target.value;
                      const { data: { session } } = await supabase.auth.getSession();
                      await fetch('/api/projects/update', {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${session.access_token}`,
                        },
                        body: JSON.stringify({ ...b, status: newStatus }),
                      });
                      setBaustellen(prev => prev.map(baustelle => b.id === b.id ? { ...baustelle, status: newStatus } : baustelle));
                    }}
                    className="input-field"
                  >
                    <option value="planning">Planung</option>
                    <option value="in_progress">In Bearbeitung</option>
                    <option value="completed">Abgeschlossen</option>
                    <option value="cancelled">Abgebrochen</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={() => startEditBaustelle(b)}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <Edit className="w-4 h-4"/>
                  </button>
                  <button 
                    onClick={() => handleDeleteBaustelle(b.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {baustellen.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <HardHat className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p>Noch keine Baustellen erstellt.</p>
          <p className="text-sm">Erstellen Sie Ihre erste Baustelle, um zu beginnen.</p>
        </div>
      )}
      
      <style jsx>{`
        .input-field {
            appearance: none; display: block; width: 100%;
            padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1;
            border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
            background-color: white;
            color: #0f172a;
        }
        .input-field::placeholder {
            color: #94a3b8;
        }
        .input-field:focus {
            outline: none; --tw-ring-color: #3b82f6; border-color: #3b82f6;
            box-shadow: 0 0 0 1px #3b82f6;
        }
        @keyframes fade-in-down {
            0% {
                opacity: 0;
                transform: translateY(-10px);
            }
            100% {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .animate-fade-in-down {
            animation: fade-in-down 0.3s ease-out;
        }
    `}</style>
    </div>
  )
} 