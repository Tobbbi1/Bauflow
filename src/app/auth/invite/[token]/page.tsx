'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Building2, UserPlus, AlertCircle } from 'lucide-react'

interface Invitation {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  expires_at: string
  companies: {
    name: string
  }
}

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClientComponentClient()
  
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (params.token) {
      fetchInvitation()
    }
  }, [params.token])

  const fetchInvitation = async () => {
    try {
      const response = await fetch(`/api/invitations/${params.token}`)
      if (response.ok) {
        const data = await response.json()
        setInvitation(data)
      } else {
        setError('Einladung nicht gefunden oder abgelaufen')
      }
    } catch (error) {
      setError('Fehler beim Laden der Einladung')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwörter stimmen nicht überein')
      return
    }

    if (formData.password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // Sign up user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invitation!.email,
        password: formData.password
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (authData.user) {
        // Accept invitation
        const response = await fetch(`/api/invitations/${params.token}/accept`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: authData.user.id })
        })

        if (response.ok) {
          router.push('/app?welcome=true')
        } else {
          setError('Fehler beim Akzeptieren der Einladung')
        }
      }
    } catch (error) {
      setError('Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Einladung wird geladen...</p>
        </div>
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Einladung ungültig</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <Link
            href="/auth/register"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Neue Registrierung
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Einladung annehmen</h1>
          <p className="text-slate-600">
            Sie wurden zu <strong>{invitation?.companies.name}</strong> eingeladen
          </p>
        </div>

        {invitation && (
          <div className="bg-slate-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-slate-900 mb-2">Ihre Details:</h3>
            <p className="text-sm text-slate-600">
              <strong>Name:</strong> {invitation.first_name} {invitation.last_name}
            </p>
            <p className="text-sm text-slate-600">
              <strong>E-Mail:</strong> {invitation.email}
            </p>
            <p className="text-sm text-slate-600">
              <strong>Rolle:</strong> {invitation.role}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Passwort erstellen *
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Mindestens 6 Zeichen"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Passwort bestätigen *
            </label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Passwort wiederholen"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Wird erstellt...
              </>
            ) : (
              'Account erstellen'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-600">
            Haben Sie bereits einen Account?{' '}
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-700">
              Hier anmelden
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 