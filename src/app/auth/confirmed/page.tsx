'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Building2, User, ArrowRight } from 'lucide-react'
import Logo from '@/components/Logo'

export default function EmailConfirmedPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(10)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/app')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-8">
          <Logo />
        </div>
        
        <div className="bg-white py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
          <div className="text-center">
            {/* Success Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>

            {/* Success Message */}
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              E-Mail erfolgreich bestätigt!
            </h2>
            
            <p className="text-gray-600 mb-6">
              Ihr Konto wurde erfolgreich aktiviert. Ihre Firma wurde erstellt und Sie können jetzt alle Features nutzen.
            </p>

            {/* What was created */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Building2 className="h-4 w-4 mr-2 text-blue-600" />
                Was wurde erstellt:
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Ihr Benutzerkonto wurde aktiviert
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Ihre Firma wurde automatisch erstellt
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Sie haben Administrator-Rechte erhalten
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Alle Features sind freigeschaltet
                </li>
              </ul>
            </div>

            {/* Automatic redirect info */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                Sie werden automatisch in <span className="font-bold">{countdown}</span> Sekunden zur App weitergeleitet.
              </p>
            </div>

            {/* Manual navigation buttons */}
            <div className="space-y-3">
              <Link
                href="/app"
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Jetzt zur App
              </Link>
              
              <Link
                href="/auth/login"
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Zur Anmeldung
              </Link>
            </div>
          </div>
        </div>

        {/* Additional info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Haben Sie Fragen? 
            <Link href="mailto:support@bauflow.de" className="text-blue-600 hover:text-blue-500 ml-1">
              Kontaktieren Sie uns
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 