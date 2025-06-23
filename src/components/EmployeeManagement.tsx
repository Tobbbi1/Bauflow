'use client'

import { useState, useEffect, FormEvent } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  PlusCircle, 
  Loader2, 
  AlertCircle, 
  Trash2, 
  Edit, 
  Users, 
  User, 
  Mail, 
  Lock, 
  ChevronUp,
  Eye,
  EyeOff
} from 'lucide-react'

interface Employee {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
  created_at: string
}

interface Profile {
  company_id: string
  role: string
}

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isFormVisible, setIsFormVisible] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [newEmployee, setNewEmployee] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('company_id, role')
          .eq('id', user.id)
          .single()
        
        if (profileError) {
          setError('Fehler beim Laden der Benutzerdaten: ' + profileError.message)
          setLoading(false)
          return
        } 
        
        setProfile(profileData)
        
        // Mitarbeiter laden
        const { data: employeesData, error: employeesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, role, created_at')
          .eq('company_id', profileData.company_id)
          .order('created_at', { ascending: false })

        if (employeesError) {
          setError(employeesError.message)
        } else {
          // E-Mail-Adressen aus auth.users holen
          const employeesWithEmail = await Promise.all(
            employeesData.map(async (employee) => {
              const { data: userData } = await supabase.auth.admin.getUserById(employee.id)
              return {
                ...employee,
                email: userData?.user?.email || 'Unbekannt'
              }
            })
          )
          setEmployees(employeesWithEmail)
        }
      }
      setLoading(false)
    }

    fetchInitialData()
  }, [supabase])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewEmployee(prev => ({ ...prev, [name]: value }))
  }

  const handleAddEmployee = async (e: FormEvent) => {
    e.preventDefault()
    if (!profile) {
      setError("Benutzerprofil nicht geladen. Bitte laden Sie die Seite neu.")
      return
    }
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          setError('Keine gültige Sitzung gefunden. Bitte melden Sie sich erneut an.')
          return
        }

        const response = await fetch('/api/employees/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(newEmployee),
        })

        const result = await response.json()
        if (!response.ok) {
          setError(result.error || 'Fehler beim Erstellen des Mitarbeiters')
          return
        }

        // Neuen Mitarbeiter zur Liste hinzufügen
        const newEmployeeWithDetails = {
          id: result.data.id,
          first_name: result.data.first_name,
          last_name: result.data.last_name,
          email: result.data.email,
          role: result.data.role,
          created_at: new Date().toISOString()
        }

        setEmployees([newEmployeeWithDetails, ...employees])
        setNewEmployee({ first_name: '', last_name: '', email: '', password: '' })
        setIsFormVisible(false)
      } catch (apiError) {
        setError('Netzwerkfehler beim Erstellen des Mitarbeiters')
      }
    }
  }

  const handleDeleteEmployee = async (employeeId: string) => {
    if (!confirm('Sind Sie sicher, dass Sie diesen Mitarbeiter löschen möchten?')) {
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setError('Keine gültige Sitzung gefunden. Bitte melden Sie sich erneut an.')
        return
      }

      // Mitarbeiter aus Supabase Auth löschen
      const { error } = await supabase.auth.admin.deleteUser(employeeId)

      if (error) {
        setError('Fehler beim Löschen des Mitarbeiters')
        return
      }

      // Mitarbeiter aus der Liste entfernen
      setEmployees(prev => prev.filter(employee => employee.id !== employeeId))
    } catch (apiError) {
      setError('Netzwerkfehler beim Löschen des Mitarbeiters')
    }
  }

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrator'
      case 'manager': return 'Manager'
      case 'employee': return 'Mitarbeiter'
      default: return role
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'manager': return 'bg-blue-100 text-blue-800'
      case 'employee': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
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
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Users /> Mitarbeiter verwalten
        </h2>
        <button
          onClick={() => setIsFormVisible(!isFormVisible)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
        >
          {isFormVisible ? <ChevronUp className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
          <span>{isFormVisible ? 'Schließen' : 'Neuer Mitarbeiter'}</span>
        </button>
      </div>
      
      {isFormVisible && (
        <form onSubmit={handleAddEmployee} className="mb-8 p-4 bg-slate-50 rounded-lg border border-slate-200 animate-fade-in-down">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label htmlFor="first_name" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                <User size={16}/>Vorname
              </label>
              <input 
                id="first_name" 
                name="first_name" 
                type="text" 
                value={newEmployee.first_name} 
                onChange={handleInputChange} 
                className="input-field" 
                placeholder="Max" 
                required 
              />
            </div>
            
            <div>
              <label htmlFor="last_name" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                <User size={16}/>Nachname
              </label>
              <input 
                id="last_name" 
                name="last_name" 
                type="text" 
                value={newEmployee.last_name} 
                onChange={handleInputChange} 
                className="input-field" 
                placeholder="Mustermann" 
                required 
              />
            </div>

            <div>
              <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                <Mail size={16}/>E-Mail-Adresse
              </label>
              <input 
                id="email" 
                name="email" 
                type="email" 
                value={newEmployee.email} 
                onChange={handleInputChange} 
                className="input-field" 
                placeholder="max@firma.de" 
                required 
              />
            </div>

            <div>
              <label htmlFor="password" className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-1">
                <Lock size={16}/>Passwort
              </label>
              <div className="relative">
                <input 
                  id="password" 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  value={newEmployee.password} 
                  onChange={handleInputChange} 
                  className="input-field pr-10" 
                  placeholder="Mindestens 6 Zeichen" 
                  required 
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <button 
              type="submit" 
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Mitarbeiter erstellen</span>
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
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mitarbeiter</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">E-Mail</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rolle</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Erstellt</th>
              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Aktionen</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {employees.map((employee) => (
              <tr key={employee.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                      {employee.first_name.charAt(0)}{employee.last_name.charAt(0)}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-slate-900">
                        {employee.first_name} {employee.last_name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {employee.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(employee.role)}`}>
                    {getRoleText(employee.role)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {new Date(employee.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={() => handleDeleteEmployee(employee.id)}
                    className="text-red-600 hover:text-red-900"
                    disabled={employee.role === 'admin'}
                    title={employee.role === 'admin' ? 'Administratoren können nicht gelöscht werden' : 'Mitarbeiter löschen'}
                  >
                    <Trash2 className="w-4 h-4"/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {employees.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p>Noch keine Mitarbeiter erstellt.</p>
          <p className="text-sm">Erstellen Sie Ihren ersten Mitarbeiter, um zu beginnen.</p>
        </div>
      )}
      
      <style jsx>{`
        .input-field {
          appearance: none; 
          display: block; 
          width: 100%;
          padding: 0.5rem 0.75rem; 
          border: 1px solid #cbd5e1;
          border-radius: 0.375rem; 
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
          background-color: white;
          color: #0f172a;
        }
        .input-field::placeholder {
          color: #94a3b8;
        }
        .input-field:focus {
          outline: none; 
          --tw-ring-color: #3b82f6; 
          border-color: #3b82f6;
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