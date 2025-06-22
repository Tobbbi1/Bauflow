'use client'

import { useState, useEffect, FormEvent } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { PlusCircle, Loader2, AlertCircle, Trash2, Edit, HardHat, User, MapPin, Calendar, FileText, ChevronUp } from 'lucide-react'

interface Baustelle {
  id: string
  name: string
  address: string
  status: string
  contact_person_name: string
  start_date: string
  end_date: string
  created_at: string
}

export default function BaustellenList() {
  const [baustellen, setBaustellen] = useState<Baustelle[]>([])
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [newBaustelle, setNewBaustelle] = useState({
      name: '',
      address: '',
      description: '',
      contact_person_name: '',
      start_date: '',
      end_date: '',
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchBaustellen = async () => {
      setLoading(true)
      const { data, error } = await supabase
          .from('projects')
          .select('id, name, address, status, contact_person_name, start_date, end_date, created_at')
          .order('created_at', { ascending: false })

        if (error) {
          setError(error.message)
        } else {
          setBaustellen(data as Baustelle[])
        }
      setLoading(false)
    }

    fetchBaustellen()
  }, [supabase])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setNewBaustelle(prev => ({ ...prev, [name]: value }));
  }

  const handleAddBaustelle = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...newBaustelle,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) {
        setError(error.message)
      } else if (data) {
        setBaustellen([data as Baustelle, ...baustellen])
        setNewBaustelle({ name: '', address: '', description: '', contact_person_name: '', start_date: '', end_date: '' });
        setIsFormVisible(false)
      }
    }
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
                onClick={() => setIsFormVisible(!isFormVisible)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
            >
                {isFormVisible ? <ChevronUp className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
                <span>{isFormVisible ? 'Schließen' : 'Neue Baustelle'}</span>
            </button>
        </div>
      
      {isFormVisible && (
        <form onSubmit={handleAddBaustelle} className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200 animate-fade-in-down">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {/* Name */}
                <div className="md:col-span-2">
                    <label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1"><FileText size={16}/>Baustellen-Name</label>
                    <input id="name" name="name" type="text" value={newBaustelle.name} onChange={handleInputChange} className="input-field" placeholder="z.B. Neubau EFH Meier" required />
                </div>

                {/* Address */}
                <div>
                    <label htmlFor="address" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1"><MapPin size={16}/>Adresse</label>
                    <input id="address" name="address" type="text" value={newBaustelle.address} onChange={handleInputChange} className="input-field" placeholder="z.B. Hauptstraße 1, 12345 Berlin" required/>
                </div>

                {/* Contact Person */}
                <div>
                    <label htmlFor="contact_person_name" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1"><User size={16}/>Ansprechpartner</label>
                    <input id="contact_person_name" name="contact_person_name" type="text" value={newBaustelle.contact_person_name} onChange={handleInputChange} className="input-field" placeholder="z.B. Herr Schmidt" required/>
                </div>

                 {/* Description */}
                <div className="md:col-span-2">
                    <label htmlFor="description" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1"><FileText size={16}/>Was muss gemacht werden?</label>
                    <textarea id="description" name="description" value={newBaustelle.description} onChange={handleInputChange} className="input-field" rows={3} placeholder="z.B. Komplette Badsanierung inkl. Fliesen"></textarea>
                </div>

                {/* Start Date */}
                <div>
                    <label htmlFor="start_date" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1"><Calendar size={16}/>Start-Datum</label>
                    <input id="start_date" name="start_date" type="date" value={newBaustelle.start_date} onChange={handleInputChange} className="input-field" required/>
                </div>

                {/* End Date */}
                <div>
                    <label htmlFor="end_date" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1"><Calendar size={16}/>End-Datum</label>
                    <input id="end_date" name="end_date" type="date" value={newBaustelle.end_date} onChange={handleInputChange} className="input-field" required/>
                </div>
            </div>

            <div className="mt-6">
                <button type="submit" className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <PlusCircle className="w-5 h-5" />
                  <span>Baustelle anlegen</span>
                </button>
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
                  <div className="text-sm font-medium text-slate-900">{b.name}</div>
                  <div className="text-sm text-slate-500">{b.address}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {new Date(b.start_date).toLocaleDateString()} - {new Date(b.end_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      b.status === 'active' ? 'bg-green-100 text-green-800' :
                      b.status === 'planning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-slate-100 text-slate-800'
                  }`}>
                    {b.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-4"><Edit className="w-4 h-4"/></button>
                  <button className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4"/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
       <style jsx>{`
        .input-field {
            appearance: none; display: block; width: 100%;
            padding: 0.5rem 0.75rem; border: 1px solid #cbd5e1;
            border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
            background-color: white;
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