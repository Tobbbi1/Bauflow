'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Link from 'next/link'
import Logo from '@/components/Logo'
import BaustellenList from '@/components/ProjectList'
import TaskList from '@/components/TaskList'
import Calendar from '@/components/Calendar'
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
  Loader2
} from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface Profile {
  first_name: string;
  last_name: string;
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
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error("Error fetching profile:", error);
        router.push('/auth/login');
      } else {
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
    const [loadingProjects, setLoadingProjects] = useState(true);
    const openTasks = [
        { id: 1, title: 'Fliesen im Bad legen', priority: 'high'},
        { id: 2, title: 'Material für Dachstuhl bestellen', priority: 'high'},
        { id: 3, title: 'Angebot für Fenster prüfen', priority: 'low'},
    ]
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
        fetchActiveProjects();
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
           <ul className="space-y-3">
                {openTasks.map(task => (
                    <li key={task.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <span className="font-medium text-slate-800">{task.title}</span>
                         <span className={`text-sm font-semibold px-2 py-1 rounded-full ${task.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {task.priority === 'high' ? 'Dringend' : 'Normal'}
                        </span>
                    </li>
                ))}
            </ul>
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
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 text-foreground">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Einstellungen</h2>
        <p className="text-slate-600">Hier können Sie Ihre Kontoeinstellungen und Firmendaten verwalten.</p>
    </div>
  )
} 