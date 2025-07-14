'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Logo from '@/components/Logo'
import { Mail, Lock, Eye, EyeOff, Loader2, XCircle, CheckCircle, Info } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [showResendEmail, setShowResendEmail] = useState(false)
  
  useEffect(() => {
    const urlMessage = searchParams.get('message')
    const urlError = searchParams.get('error')
    
    if (urlMessage === 'email_confirmation_sent') {
      setMessage('E-Mail-Bestätigung gesendet! Bitte prüfen Sie Ihr Postfach.')
    } else if (urlError) {
      switch (urlError) {
        case 'auth_callback_error':
          setError('Fehler bei der E-Mail-Bestätigung. Bitte versuchen Sie sich anzumelden.')
          break
        case 'no_user':
          setError('Benutzer nicht gefunden. Bitte registrieren Sie sich zuerst.')
          break
        case 'no_company_data':
          setError('Firmendaten nicht gefunden. Bitte registrieren Sie sich erneut.')
          break
        case 'company_creation_failed':
          setError('Firma konnte nicht erstellt werden. Bitte kontaktieren Sie den Support.')
          break
        case 'profile_creation_failed':
          setError('Profil konnte nicht erstellt werden. Bitte kontaktieren Sie den Support.')
          break
        case 'callback_error':
          setError('Fehler bei der Kontoaktivierung. Bitte versuchen Sie es erneut.')
          break
        case 'no_code':
          setError('Ungültiger Bestätigungslink. Bitte verwenden Sie den Link aus Ihrer E-Mail.')
          break
        default:
          setError('Ein unbekannter Fehler ist aufgetreten.')
      }
    }
  }, [searchParams])

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Bitte geben Sie Ihre E-Mail-Adresse ein.')
      return
    }

    try {
      setLoading(true)
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        setError(`Fehler beim Senden der E-Mail: ${error.message}`)
      } else {
        setMessage('E-Mail-Bestätigung wurde erneut gesendet. Bitte prüfen Sie Ihr Postfach.')
        setError(null)
        setShowResendEmail(false)
      }
    } catch (err: any) {
      setError('Fehler beim Senden der Bestätigungs-E-Mail.')
    } finally {
      setLoading(false)
    }
  }
  
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        console.log('Login error:', authError)
        
        // Check specific error codes and messages
        if (authError.message === 'Invalid login credentials') {
          throw new Error('Falsche E-Mail-Adresse oder Passwort. Bitte versuchen Sie es erneut.')
        } else if (authError.message === 'Email not confirmed' || authError.message.includes('email not confirmed')) {
          setShowResendEmail(true)
          throw new Error('Ihr Konto ist noch nicht aktiviert. Bitte prüfen Sie Ihr E-Mail-Postfach und klicken Sie auf den Bestätigungslink.')
        } else if (authError.message.includes('signup disabled')) {
          throw new Error('Die Registrierung ist deaktiviert. Bitte kontaktieren Sie den Administrator.')
        } else if (authError.message.includes('email address not authorized')) {
          throw new Error('Diese E-Mail-Adresse ist nicht autorisiert.')
        }
        
        // Check for common auth error scenarios
        if (authError.status === 400 && authError.message.includes('Unable to validate email address')) {
          setShowResendEmail(true)
          throw new Error('E-Mail-Adresse konnte nicht validiert werden. Bitte prüfen Sie Ihre E-Mail-Bestätigung.')
        }
        
        throw new Error(authError.message || 'Ein unbekannter Fehler ist aufgetreten.')
      }

      if (authData.user) {
        // Check if user has confirmed email
        if (!authData.user.email_confirmed_at) {
          setShowResendEmail(true)
          throw new Error('Ihr Konto ist noch nicht aktiviert. Bitte prüfen Sie Ihr E-Mail-Postfach und klicken Sie auf den Bestätigungslink.')
        }
        
        router.push('/app')
        router.refresh()
      }

    } catch (err: any) {
      console.error('Login error details:', err)
      setError(err.message)
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
            {message && (
              <div className="bg-green-50 p-3 rounded-md flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <p className="text-sm text-green-600">{message}</p>
              </div>
            )}
            {error && (
              <div className="bg-red-50 p-3 rounded-md">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
                {showResendEmail && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      disabled={loading}
                      className="text-sm text-blue-600 hover:text-blue-500 font-medium disabled:opacity-50"
                    >
                      {loading ? 'Wird gesendet...' : 'E-Mail-Bestätigung erneut senden'}
                    </button>
                  </div>
                )}
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
                  className="appearance-none block w-full px-3 py-2 pl-10 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-900"
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
                  className="appearance-none block w-full px-3 py-2 pl-10 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-slate-900"
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

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
} 