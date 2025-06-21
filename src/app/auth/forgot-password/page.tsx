import Link from 'next/link'
import Logo from '@/components/Logo'
import { ChevronLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
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
          <div>
            <h2 className="text-center text-3xl font-extrabold text-slate-900">
              Passwort vergessen?
            </h2>
            <p className="mt-2 text-center text-sm text-slate-600">
              Kein Problem. Geben Sie Ihre E-Mail-Adresse ein und wir senden Ihnen einen Link zum Zurücksetzen.
            </p>
          </div>
          
          <form className="mt-8 space-y-6" action="/api/auth/forgot-password" method="POST">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                E-Mail-Adresse
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="ihre@email.de"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Link zum Zurücksetzen anfordern
              </button>
            </div>
          </form>

           <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">
                  Oder kehren Sie zurück
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link href="/auth/login" className="flex items-center justify-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-500">
                <ChevronLeft className="w-4 h-4" />
                <span>Zurück zum Login</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 