'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Logo from '@/components/Logo'
import { Mail, Lock, Eye, EyeOff, Loader2, XCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createClientComponentClient()

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      // On successful login, redirect to the app dashboard.
      // The auth listener in the main layout will handle the user session.
      router.push('/app')
      router.refresh() // Ensures the page re-renders with the new auth state

    } catch (e: any) {
      if (e.message === 'Invalid login credentials') {
          setError('Falsche E-Mail-Adresse oder Passwort. Bitte versuchen Sie es erneut.')
      } else if (e.message === 'Email not confirmed') {
          setError('Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse, bevor Sie sich anmelden.')
      } else {
          setError('Ein unerwarteter Fehler ist aufgetreten: ' + e.message)
      }
    } finally {
      setLoading(false)
    }
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
          <div className="pb-4">
            <h2 className="text-center text-3xl font-extrabold text-slate-900">
              Anmelden
            </h2>
            <p className="mt-2 text-center text-sm text-slate-600">
              Oder{' '}
              <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
                registrieren Sie sich für ein kostenloses Konto
              </Link>
            </p>
          </div>
          
          <form className="space-y-6" onSubmit={handleLogin}>
            {error && (
              <div className="bg-red-50 p-3 rounded-md flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                E-Mail-Adresse
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                 <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                    <Mail className="h-5 w-5 text-slate-400" />
                 </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 pl-10 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="ihre@email.de"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password"
                       className="block text-sm font-medium text-slate-700">
                  Passwort
                </label>
                 <div className="text-sm">
                  <Link href="/auth/forgot-password"
                        className="font-medium text-blue-600 hover:text-blue-500">
                    Passwort vergessen?
                  </Link>
                </div>
              </div>
              <div className="mt-1 relative rounded-md shadow-sm">
                 <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                    <Lock className="h-5 w-5 text-slate-400" />
                 </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 pl-10 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                 <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-slate-400 hover:text-slate-500">
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                 </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Anmelden'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 