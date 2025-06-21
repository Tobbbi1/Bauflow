'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Logo from '@/components/Logo'
import { supabase } from '@/lib/supabase' // Correctly import the supabase instance

function VerifyComponent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('E-Mail-Adresse wird bestätigt...')

  const handleVerification = useCallback(async () => {
    const code = searchParams.get('code')

    if (!code) {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email_confirmed_at) {
        setStatus('success')
        setMessage('Ihre E-Mail-Adresse ist bereits bestätigt. Sie werden weitergeleitet.')
        setTimeout(() => router.push('/app'), 3000)
        return
      }

      setStatus('error')
      setMessage('Kein Verifizierungscode im Link gefunden. Bitte versuchen Sie es erneut.')
      return
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      setStatus('success')
      setMessage('Ihre E-Mail-Adresse wurde erfolgreich bestätigt! Sie werden in Kürze zum Login weitergeleitet.')
      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
    } else {
      setStatus('error')
      setMessage(error.message || 'Ein Fehler ist bei der Bestätigung aufgetreten.')
    }
  }, [router, searchParams])

  useEffect(() => {
    handleVerification()
  }, [handleVerification])


  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-500" />
      case 'error':
        return <XCircle className="h-12 w-12 text-red-500" />
      default:
        return <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
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
        
        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            {getStatusIcon()}
            
            <h2 className={`mt-4 text-2xl font-bold ${status === 'success' ? 'text-green-600' : status === 'error' ? 'text-red-600' : 'text-blue-600'}`}>
              {status === 'loading' && 'E-Mail wird bestätigt...'}
              {status === 'success' && 'E-Mail bestätigt!'}
              {status === 'error' && 'Bestätigung fehlgeschlagen'}
            </h2>
            
            <p className="mt-2 text-sm text-slate-600">
              {message}
            </p>

            {status === 'success' && (
              <div className="mt-6">
                <p className="text-sm">Sie werden automatisch weitergeleitet.</p>
              </div>
            )}

            {status === 'error' && (
              <div className="mt-6 space-y-3">
                <Link
                  href="/auth/register"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-blue-500/50"
                >
                  Erneut registrieren
                </Link>
                <div>
                  <Link
                    href="/auth/login"
                    className="text-sm text-blue-600 hover:text-blue-500"
                  >
                    Zur Anmeldung
                  </Link>
                </div>
              </div>
            )}

            <div className="mt-6">
              <Link
                href="/"
                className="text-sm text-slate-600 hover:text-slate-500"
              >
                Zurück zur Startseite
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
      </div>
    }>
      <VerifyComponent />
    </Suspense>
  )
} 