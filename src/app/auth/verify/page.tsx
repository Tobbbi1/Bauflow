'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

export default function VerifyPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const handleVerification = async () => {
      // PKCE Flow uses a 'code' in the URL search params, not a token in the hash.
      const code = new URL(window.location.href).searchParams.get('code')

      if (code) {
        try {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            throw error
          }
          setStatus('success')
          // Redirect to the app dashboard after a short delay
          setTimeout(() => {
            router.push('/app')
          }, 3000)
        } catch (e: any) {
          setError(e.message || 'Ein unbekannter Fehler ist aufgetreten.')
          setStatus('error')
        }
      } else {
        // This case is unlikely with the PKCE flow but good to have.
        // It could also happen if the user navigates to this page manually.
        setError('Kein gültiger Bestätigungscode in der URL gefunden.')
        setStatus('error')
      }
    }

    // A small delay to ensure the URL is fully parsed on the client
    const timer = setTimeout(() => {
      handleVerification()
    }, 100);

    return () => clearTimeout(timer);

  }, [router, supabase])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-center">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        {status === 'loading' && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
            <h1 className="mt-4 text-2xl font-bold text-slate-800">
              Bestätigung wird überprüft...
            </h1>
            <p className="mt-2 text-slate-600">
              Bitte haben Sie einen Moment Geduld, wir verifizieren Ihr Konto.
            </p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <h1 className="mt-4 text-2xl font-bold text-slate-800">
              Konto erfolgreich bestätigt!
            </h1>
            <p className="mt-2 text-slate-600">
              Sie werden in Kürze zu Ihrem Dashboard weitergeleitet.
            </p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-red-500" />
            <h1 className="mt-4 text-2xl font-bold text-slate-800">
              Fehler bei der Bestätigung
            </h1>
            <p className="mt-2 text-slate-600">
              Leider gab es ein Problem bei der Bestätigung Ihres Kontos.
            </p>
            {error && (
              <p className="mt-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </p>
            )}
             <Link href="/auth/login" className="mt-6 inline-block w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              Zurück zum Login
            </Link>
          </>
        )}
      </div>
    </div>
  )
} 