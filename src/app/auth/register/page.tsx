'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Eye, EyeOff, Mail, Lock, User, Building, Phone, AlertCircle, CheckCircle } from 'lucide-react'
import Logo from '@/components/Logo'

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  // Form data state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companyPhone, setCompanyPhone] = useState('')
  const [showPassword, setShowPassword] = useState(false)


  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          company_name: companyName,
          company_phone: companyPhone
        },
        // The verification email will be sent to this URL
        emailRedirectTo: `${location.origin}/auth/verify`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="mt-4 text-2xl font-bold text-slate-800">Registrierung erfolgreich!</h2>
            <p className="mt-2 text-slate-600">
              Wir haben Ihnen eine Bestätigungs-E-Mail an <span className="font-bold">{email}</span> gesendet. Bitte klicken Sie auf den Link in der E-Mail, um Ihr Konto zu aktivieren.
            </p>
            <Link href="/" className="mt-6 inline-block w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              Zurück zur Startseite
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link href="/" className="flex items-center gap-3">
            <Logo />
            <span className="text-2xl font-bold text-slate-800">Bauflow</span>
          </Link>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <form onSubmit={handleRegister} className="space-y-6">
            <h2 className="text-center text-3xl font-extrabold text-slate-900">
              Konto erstellen
            </h2>
            {error && (
              <div className="bg-red-50 p-3 rounded-md flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Step 1: User Info */}
            <fieldset>
              <legend className="block text-sm font-medium text-slate-700">Persönliche Daten</legend>
              <div className="mt-2 space-y-4">
                <div className="grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                  <input type="text" placeholder="Vorname" value={firstName} onChange={e => setFirstName(e.target.value)} required className="input-field"/>
                  <input type="text" placeholder="Nachname" value={lastName} onChange={e => setLastName(e.target.value)} required className="input-field"/>
                </div>
                <input type="email" placeholder="E-Mail-Adresse" value={email} onChange={e => setEmail(e.target.value)} required className="input-field w-full"/>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} placeholder="Passwort (mind. 6 Zeichen)" value={password} onChange={e => setPassword(e.target.value)} required className="input-field w-full"/>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-500">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </fieldset>

            {/* Step 2: Company Info */}
            <fieldset>
              <legend className="block text-sm font-medium text-slate-700">Firmendaten</legend>
              <div className="mt-2 space-y-4">
                <input type="text" placeholder="Firmenname" value={companyName} onChange={e => setCompanyName(e.target.value)} required className="input-field w-full"/>
                <input type="tel" placeholder="Telefonnummer (optional)" value={companyPhone} onChange={e => setCompanyPhone(e.target.value)} className="input-field w-full"/>
              </div>
            </fieldset>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
              >
                {loading ? 'Registrierung wird verarbeitet...' : 'Kostenlos registrieren'}
              </button>
            </div>
            <p className="text-center text-sm text-slate-600">
              Sie haben bereits ein Konto?{' '}
              <Link href="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
                Hier anmelden
              </Link>
            </p>
          </form>
        </div>
      </div>
      <style jsx>{`
        .input-field {
          appearance: none;
          display: block;
          padding: 0.5rem 0.75rem;
          border: 1px solid #cbd5e1;
          border-radius: 0.375rem;
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
          color: #0f172a;
        }
        .input-field:focus {
          outline: none;
          --tw-ring-color: #3b82f6;
          border-color: #3b82f6;
          box-shadow: 0 0 0 1px #3b82f6;
        }
      `}</style>
    </div>
  )
} 