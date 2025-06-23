'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import Logo from '@/components/Logo'
import EmployeeCalendar from '@/components/EmployeeCalendar'
import {
  Calendar as LucideCalendar,
  Clock,
  LogOut,
  Menu,
  X,
  User,
  Loader2
} from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface Profile {
  first_name: string;
  last_name: string;
  role: string;
}

export default function EmployeePage() {
  const [activeTab, setActiveTab] = useState('calendar')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true);

  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  const fetchUserData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, role')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error("Error fetching profile:", error);
        router.push('/auth/login');
      } else {
        // Prüfen ob Benutzer ein Mitarbeiter ist
        if (profileData.role !== 'employee') {
          // Nicht-Mitarbeiter zur normalen App weiterleiten
          router.push('/app');
          return;
        }
        setProfile(profileData);
        setLoading(false);
      }
    } else {
      router.push('/auth/login');
    }
  }, [router, supabase]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const navItems = [
    { id: 'calendar', label: 'Mein Kalender', icon: LucideCalendar },
    { id: 'timesheets', label: 'Stundenzettel', icon: Clock },
  ]

  const mainContent = () => {
    switch (activeTab) {
      case 'calendar':
        return <EmployeeCalendar />
      case 'timesheets':
        return (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Clock /> Stundenzettel
            </h2>
            <p className="text-slate-600 mt-4">
              Die Stundenerfassung wird in Kürze verfügbar sein. Hier können Sie Ihre Arbeitszeiten eintragen und verwalten.
            </p>
          </div>
        )
      default:
        return <EmployeeCalendar />
    }
  }

  if (loading) {
    return (
        <div className="flex justify-center items-center min-h-screen bg-slate-50">
            <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 flex text-foreground">
      {/* Sidebar */}
      <aside
        className={`bg-white border-r border-slate-200 transform ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 ease-in-out fixed lg:relative w-64 h-full z-40`}
      >
        <div className="flex items-center gap-3 p-4 border-b border-slate-200">
          <Logo />
          <span className="text-2xl font-bold text-slate-800">Bauflow</span>
        </div>
        <nav className="p-4 flex flex-col justify-between h-[calc(100%-145px)]">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    setActiveTab(item.id)
                    setIsMenuOpen(false)
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
          <div>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Abmelden</span>
                </button>
              </li>
            </ul>
          </div>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              className="lg:hidden text-slate-600"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X/> : <Menu />}
            </button>
            <div className="flex-1" />
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  {profile?.first_name?.charAt(0)}{profile?.last_name?.charAt(0)}
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-medium text-slate-900">
                    {profile?.first_name} {profile?.last_name}
                  </div>
                  <div className="text-xs text-slate-500">Mitarbeiter</div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {mainContent()}
          </div>
        </main>
      </div>

      {/* Mobile menu overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
    </div>
  )
} 