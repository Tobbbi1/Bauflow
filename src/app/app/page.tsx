'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import Logo from '@/components/Logo'
import BaustellenList from '@/components/ProjectList'
import TaskList from '@/components/TaskList'
import Calendar from '@/components/Calendar'
import EmployeeManagement from '@/components/EmployeeManagement'
import {
  LayoutDashboard,
  HardHat,
  Calendar as LucideCalendar,
  CheckSquare,
  Users,
  Timer,
  Settings,
  LogOut,
  Bell,
  PlusCircle,
  Menu,
  X,
  Building,
  Briefcase,
  User,
  Clock,
  Wrench,
  Loader2,
  Building2
} from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface Profile {
  first_name: string;
  last_name: string;
  role: string;
}

export default function AppPage() {
  const [activeTab, setActiveTab] = useState('dashboard')
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
        if (profileData.role === 'employee') {
          router.push('/employee');
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
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'baustellen', label: 'Baustellen', icon: HardHat },
    { id: 'calendar', label: 'Kalender', icon: LucideCalendar },
    { id: 'tasks', label: 'Aufgaben', icon: CheckSquare },
    { id: 'employees', label: 'Mitarbeiter', icon: Users },
    { id: 'timesheets', label: 'Stundenzettel', icon: Clock },
  ]

  const mainContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardContent profile={profile} />
      case 'baustellen':
        return <BaustellenList />
      case 'calendar':
        return <Calendar />
      case 'tasks':
        return <TaskList />
      case 'employees':
        return <EmployeeManagement />
      case 'settings':
        return <SettingsContent />
      default:
        return (
          <div className="bg-background-card rounded-xl p-6 shadow-sm border border-border-color text-foreground">
            <h2 className="text-2xl font-bold capitalize mb-4">{navItems.find(item => item.id === activeTab)?.label}</h2>
            <p className="text-foreground-muted">Diese Funktion wird derzeit entwickelt und ist in Kürze für Sie verfügbar.</p>
          </div>
        )
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
              <button className="text-slate-500 hover:text-slate-800">
                <Bell className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                  {profile && profile.first_name && profile.last_name ? `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}` : <User size={20}/>}
                </div>
                <div className="hidden md:flex flex-col text-right">
                    <span className="font-medium text-slate-800 text-sm">{profile && profile.first_name ? `${profile.first_name} ${profile.last_name}` : 'Benutzer'}</span>
                    <span className="text-xs text-slate-500">Admin</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-slate-50">
          {mainContent()}
        </main>
      </div>
    </div>
  )
}

function DashboardContent({ profile }: { profile: Profile | null }) {
    const [activeProjects, setActiveProjects] = useState<{id: string, name: string, address: string}[]>([]);
    const [openTasks, setOpenTasks] = useState<{id: string, title: string, priority: string}[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [loadingTasks, setLoadingTasks] = useState(true);
    const supabase = createClientComponentClient();

    useEffect(() => {
        const fetchActiveProjects = async () => {
            setLoadingProjects(true);
            const { data, error } = await supabase
                .from('projects')
                .select('id, name, address')
                .eq('status', 'active') // 'active' ist der Status für "im Vollzug"
                .limit(3);

            if (!error) {
                setActiveProjects(data);
            }
            setLoadingProjects(false);
        };

        const fetchOpenTasks = async () => {
            setLoadingTasks(true);
            const { data, error } = await supabase
                .from('tasks')
                .select('id, title, priority')
                .in('status', ['pending', 'in_progress'])
                .limit(5);

            if (!error && data) {
                setOpenTasks(data.map(task => ({
                    id: task.id,
                    title: task.title,
                    priority: task.priority || 'medium'
                })));
            }
            setLoadingTasks(false);
        };

        fetchActiveProjects();
        fetchOpenTasks();
    }, [supabase]);
    
    const quickActions = [
        { label: 'Neue Baustelle', icon: Briefcase, action: () => console.log("Neue Baustelle") },
        { label: 'Stundenzettel', icon: Clock, action: () => console.log("Stundenzettel") },
        { label: 'Neue Aufgabe', icon: Wrench, action: () => console.log("Neue Aufgabe") }
    ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        Willkommen zurück, {profile && profile.first_name ? profile.first_name : 'Nutzer'}!
      </h1>
      <p className="text-lg text-slate-600 mb-8">
        Hier ist Ihr Überblick für heute.
      </p>

       <div className="mb-8">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Was möchten Sie heute tun?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map(item => (
                <button key={item.label} onClick={item.action} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:bg-slate-100 transition-colors flex flex-col items-center justify-center text-center">
                    <item.icon className="w-8 h-8 text-blue-600 mb-2" />
                    <span className="font-medium text-slate-700">{item.label}</span>
                </button>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Offene Aufgaben</h2>
          {loadingTasks ? (
            <div className="flex justify-center items-center p-4">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            </div>
          ) : openTasks.length > 0 ? (
            <ul className="space-y-3">
                {openTasks.map(task => (
                    <li key={task.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="font-medium text-slate-800">{task.title}</span>
                         <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
                           task.priority === 'high' || task.priority === 'urgent' ? 'bg-red-100 text-red-700' : 
                           task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                         }`}>
                            {task.priority === 'high' || task.priority === 'urgent' ? 'Dringend' : 
                             task.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                        </span>
                    </li>
                ))}
            </ul>
          ) : (
            <p className="text-center py-4 text-slate-500">Keine offenen Aufgaben vorhanden.</p>
          )}
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Nächster Termin</p>
              <p className="text-2xl font-bold text-slate-900">Baubesprechung Meier</p>
              <p className="text-sm text-slate-500">Morgen, 10:00 Uhr</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <LucideCalendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

       <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
         <h2 className="text-xl font-semibold text-slate-800 mb-4">Aktive Baustellen</h2>
         {loadingProjects ? (
            <div className="flex justify-center items-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
         ) : activeProjects.length > 0 ? (
            <ul className="space-y-3">
                {activeProjects.map(project => (
                    <li key={project.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                        <div>
                            <p className="font-medium text-slate-800">{project.name}</p>
                            <p className="text-sm text-slate-500">{project.address}</p>
                        </div>
                        <span className="text-sm font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">Aktiv</span>
                    </li>
                ))}
            </ul>
         ) : (
            <p className="text-center py-4 text-slate-500">Derzeit sind keine Baustellen im Vollzug.</p>
         )}
       </div>
    </div>
  )
}

function SettingsContent() {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const supabase = createClientComponentClient()
  const router = useRouter()

  const handleDeleteAccount = async () => {
    if (!confirm('Sind Sie sicher, dass Sie Ihren Account und alle Daten unwiderruflich löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      return
    }

    setIsDeleting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Alle Daten des Benutzers löschen
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
        
        if (deleteError) {
          alert('Fehler beim Löschen des Accounts: ' + deleteError.message)
          setIsDeleting(false)
          return
        }

        // Abmelden und zur Startseite weiterleiten
        await supabase.auth.signOut()
        router.push('/')
        router.refresh()
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Accounts:', error)
      alert('Fehler beim Löschen des Accounts')
      setIsDeleting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 text-foreground">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Einstellungen</h2>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Firmen-Einstellungen</h3>
          <p className="text-slate-600 mb-4">
            Verwalten Sie Ihre Firmendaten, die für Stundenzettel und andere Dokumente verwendet werden.
          </p>
          <Link 
            href="/app/settings" 
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Building2 className="w-4 h-4" />
            Firmen-Daten bearbeiten
          </Link>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <h3 className="text-lg font-semibold text-slate-700 mb-3">Kontoeinstellungen</h3>
          <p className="text-slate-600 mb-4">Hier können Sie Ihre Kontoeinstellungen verwalten.</p>
        </div>

        <div className="border-t border-slate-200 pt-6">
          <h3 className="text-lg font-semibold text-red-700 mb-3">Gefährliche Aktionen</h3>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-800 mb-2">Account löschen</h4>
            <p className="text-red-600 text-sm mb-4">
              Wenn Sie Ihren Account löschen, werden alle Ihre Daten unwiderruflich entfernt. 
              Dies umfasst alle Baustellen, Aufgaben und andere Informationen.
            </p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isDeleting}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isDeleting ? 'Wird gelöscht...' : 'Account löschen'}
            </button>
          </div>
        </div>

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <h3 className="text-lg font-semibold text-red-700 mb-4">Account wirklich löschen?</h3>
              <p className="text-slate-600 mb-6">
                Diese Aktion kann nicht rückgängig gemacht werden. Alle Ihre Daten werden unwiderruflich gelöscht.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isDeleting ? 'Wird gelöscht...' : 'Endgültig löschen'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 