import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Calendar, 
  Building2, 
  Users, 
  Clock, 
  Settings, 
  LogOut 
} from 'lucide-react'

const menuItems = [
  { icon: Home, label: 'Dashboard', href: '/app' },
  { icon: Calendar, label: 'Kalender', href: '/app/calendar' },
  { icon: Building2, label: 'Baustellen', href: '/app/projects' },
  { icon: Users, label: 'Mitarbeiter', href: '/app/employees' },
  { icon: Clock, label: 'Stundenzettel', href: '/app/timesheets' },
  { icon: Settings, label: 'Einstellungen', href: '/app/settings' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Bauflow</h1>
        <p className="text-sm text-slate-500">Baustellen-Management</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || 
                           (item.href !== '/app' && pathname.startsWith(item.href))
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User Menu */}
      <div className="p-4 border-t border-slate-200">
        <Link
          href="/auth/login"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Abmelden
        </Link>
      </div>
    </div>
  )
} 