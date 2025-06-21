'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { CheckCircle, XCircle } from 'lucide-react'

export default function ResetPasswordPage() {
    const router = useRouter()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const supabase = createClientComponentClient()

    const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)
        setSuccess(false)

        if (password !== confirmPassword) {
            setError('Die Passwörter stimmen nicht überein.')
            return
        }
        if (password.length < 6) {
            setError('Das Passwort muss mindestens 6 Zeichen lang sein.')
            return
        }

        const { error } = await supabase.auth.updateUser({ password })

        if (error) {
            setError(error.message)
        } else {
            setSuccess(true)
            setTimeout(() => {
                router.push('/auth/login')
            }, 3000);
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
                    {success ? (
                        <div className="text-center">
                            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                            <h2 className="mt-4 text-2xl font-bold text-slate-800">Passwort erfolgreich geändert!</h2>
                            <p className="mt-2 text-slate-600">
                                Sie können sich nun mit Ihrem neuen Passwort anmelden. Sie werden in Kürze weitergeleitet.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div>
                                <h2 className="text-center text-3xl font-extrabold text-slate-900">
                                    Neues Passwort festlegen
                                </h2>
                                <p className="mt-2 text-center text-sm text-slate-600">
                                    Geben Sie Ihr neues Passwort ein, um Ihr Konto wiederherzustellen.
                                </p>
                            </div>

                            <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                                        Neues Passwort
                                    </label>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="confirm-password"
                                           className="block text-sm font-medium text-slate-700">
                                        Passwort bestätigen
                                    </label>
                                    <input
                                        id="confirm-password"
                                        name="confirm-password"
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    />
                                </div>

                                {error && (
                                    <div className="bg-red-50 p-3 rounded-md flex items-center gap-2">
                                        <XCircle className="h-5 w-5 text-red-500" />
                                        <p className="text-sm text-red-600">{error}</p>
                                    </div>
                                )}

                                <div>
                                    <button
                                        type="submit"
                                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Passwort ändern & Anmelden
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
} 