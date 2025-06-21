'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Logo from '@/components/Logo'
import ProjectList from '@/components/ProjectList'
import {
  LayoutDashboard,
  FolderKanban,
  Calendar,
  CheckSquare,
  Users,
  Timer,
  Package,
  Settings,
  LogOut,
  Bell,
  PlusCircle,
  Camera,
  Menu,
  X
} from 'lucide-react'

export default function AppPage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projekte', icon: FolderKanban },
    { id: 'calendar', label: 'Kalender', icon: Calendar },
    { id: 'tasks', label: 'Aufgaben', icon: CheckSquare },
    { id: 'employees', label: 'Mitarbeiter', icon: Users },
    { id: 'time', label: 'Zeiterfassung', icon: Timer },
    { id: 'materials', label: 'Materialien', icon: Package },
  ]

  const mainContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent />
      case 'projects':
        return <ProjectList />
      case 'settings':
        return <SettingsContent />
      default:
        return (
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-2xl font-bold text-slate-800 capitalize mb-4">{activeTab}</h2>
            <p className="text-slate-600">Diese Funktion wird derzeit entwickelt.</p>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
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
                  onClick={() => {
                    setActiveTab('settings')
                    setIsMenuOpen(false)
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    activeTab === 'settings'
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Einstellungen</span>
                </button>
              </li>
              <li>
                <Link href="/"
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </Link>
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
              <button className="text-slate-500 hover:text-slate-800">
                <Bell className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                  T
                </div>
                <span className="hidden md:block font-medium text-slate-700">Tobias</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {mainContent()}
        </main>
      </div>
    </div>
  )
}

function DashboardContent() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-slate-900 mb-8">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Aktive Projekte</p>
              <p className="text-2xl font-bold text-slate-900">3</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FolderKanban className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Offene Aufgaben</p>
              <p className="text-2xl font-bold text-slate-900">12</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <CheckSquare className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Heute gearbeitet</p>
              <p className="text-2xl font-bold text-slate-900">6.5h</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Timer className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Materialkosten</p>
              <p className="text-2xl font-bold text-slate-900">€2,450</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 mb-8">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Schnellaktionen</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <Timer className="w-5 h-5 text-slate-500" />
            <span className="font-medium text-slate-700">Zeiterfassung starten</span>
          </button>
          <button className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <PlusCircle className="w-5 h-5 text-slate-500" />
            <span className="font-medium text-slate-700">Neue Aufgabe</span>
          </button>
          <button className="flex items-center gap-3 p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <Camera className="w-5 h-5 text-slate-500" />
            <span className="font-medium text-slate-700">Foto hochladen</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function SettingsContent() {
  return (
    <div>
      <h2 className="text-3xl font-bold text-slate-900 mb-8">Einstellungen</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <h3 className="text-xl font-semibold text-slate-800">Profil</h3>
          <p className="text-slate-500">Passen Sie Ihre persönlichen Daten an.</p>
        </div>
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <form className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-3xl">
                T
              </div>
              <button className="border border-slate-300 px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100">
                Bild ändern
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Vollständiger Name</label>
              <input type="text" defaultValue="Tobias" className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">E-Mail Adresse</label>
              <input type="email" defaultValue="tobias@example.com" className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
            </div>
            <div className="pt-2">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
                Änderungen speichern
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-1">
          <h3 className="text-xl font-semibold text-slate-800">Sicherheit</h3>
          <p className="text-slate-500">Verwalten Sie Ihr Passwort und die 2-Faktor-Authentifizierung.</p>
        </div>
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700">Aktuelles Passwort</label>
              <input type="password" className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Neues Passwort</label>
              <input type="password" className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
            </div>
            <div className="pt-2">
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700">
                Passwort ändern
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 