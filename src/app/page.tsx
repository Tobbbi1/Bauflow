import Link from 'next/link'
import Logo from '@/components/Logo'
import { LayoutDashboard, FolderKanban, CheckSquare, Calendar, Timer, WifiOff, Zap } from 'lucide-react'

export default function Home() {
  const features = [
    {
      icon: <LayoutDashboard className="w-8 h-8 text-blue-500" />,
      title: "Dashboard",
      description: "Ihre Kommandozentrale. Behalten Sie den Überblick über alle Baustellen, Aufgaben und Termine."
    },
    {
      icon: <FolderKanban className="w-8 h-8 text-green-500" />,
      title: "Baustellenmanagement",
      description: "Organisieren Sie Projekte mit allen wichtigen Infos, Plänen und einem digitalen Bautagebuch."
    },
    {
      icon: <CheckSquare className="w-8 h-8 text-purple-500" />,
      title: "Aufgabenmanagement",
      description: "Weisen Sie Aufgaben zu, verfolgen Sie den Fortschritt und kommunizieren Sie direkt im Team."
    },
    {
      icon: <Calendar className="w-8 h-8 text-orange-500" />,
      title: "Kalender & Planung",
      description: "Planen Sie Ihre Mitarbeiter effizient per Drag & Drop und vermeiden Sie Terminkonflikte."
    },
    {
      icon: <Timer className="w-8 h-8 text-red-500" />,
      title: "Zeiterfassung",
      description: "Erfassen Sie Arbeits-, Pausen- und Fahrtzeiten projektbezogen – sekundengenau per Timer."
    },
    {
      icon: <WifiOff className="w-8 h-8 text-indigo-500" />,
      title: "Offline-Funktion",
      description: "Arbeiten Sie auch ohne Internetverbindung im Funkloch weiter. Die Daten synchronisieren sich später."
    }
  ]

  const ShinyText = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <span 
      className={`font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-yellow-500 ${className}`}
      style={{ textShadow: '0 0 8px rgba(251, 191, 36, 0.7)' }}
    >
      {children}
    </span>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Beta Banner */}
      <div className="bg-gradient-to-r from-gray-900 to-black text-white text-center py-2.5 px-4 text-sm relative z-50">
        <p>
            <Zap className="w-4 h-4 inline-block mr-2 text-yellow-400" />
            <span className="font-semibold">
                <ShinyText>Beta-Phase</ShinyText>
            </span>: Registrieren Sie sich jetzt und nutzen Sie Bauflow Premium für 1 ganzes Jahr kostenlos.
        </p>
      </div>

      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-3">
              <Logo />
              <span className="text-2xl font-bold text-slate-800">Bauflow</span>
            </Link>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <a href="#features" className="text-slate-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Features
                </a>
                <a href="#pricing" className="text-slate-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Preise
                </a>
                <Link href="/auth/login" className="text-slate-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Anmelden
                </Link>
                <Link href="/auth/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-blue-500/50">
                  Kostenlos registrieren
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center gap-4 mb-6">
              <Logo />
              <h1 className="text-4xl md:text-6xl font-bold text-slate-900">
                Bauflow
              </h1>
            </div>
            <p className="text-xl text-slate-600 mb-2 max-w-3xl mx-auto font-medium">
              Die digitale Werkzeugkiste für kleine Handwerksbetriebe und selbstständige Handwerker.
            </p>
            <p className="text-lg text-slate-500 mb-8 max-w-2xl mx-auto">
              Vereinfachen Sie Projektmanagement, Mitarbeiterplanung und Zeiterfassung – browserbasiert, intuitiv und offlinefähig.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register" className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/50">
                Jetzt 1 Jahr kostenlos testen
              </Link>
              <a href="#features" className="border border-slate-300 text-slate-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-slate-100 transition-colors">
                Mehr erfahren
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Image/Illustration */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-white rounded-2xl shadow-2xl p-4">
          <div className="aspect-video bg-slate-100 rounded-xl flex items-center justify-center">
            <div className="text-center p-8">
              <LayoutDashboard className="w-16 h-16 text-blue-500 mx-auto mb-4" />
              <p className="text-slate-600 font-medium">Bauflow Dashboard</p>
              <p className="text-sm text-slate-500">Ihre Kommandozentrale für alle Projekte.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Alles was Sie für Ihr Handwerksbetrieb brauchen
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Von der Baustellenverwaltung bis zur Zeiterfassung - alles in einer modernen, 
              benutzerfreundlichen Anwendung.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-slate-50 rounded-xl p-6 hover:shadow-md transition-shadow border border-slate-100">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center mb-4 border border-slate-200">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Ein faires & transparentes Preismodell
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Starten Sie mit unserer kostenlosen Beta-Phase und sichern Sie sich alle Vorteile für Ihr Unternehmen.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 flex flex-col">
              <div className="text-center flex-grow">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Basis</h3>
                <p className="text-4xl font-bold text-slate-800 mb-4">€0</p>
                <p className="text-slate-600 mb-6 font-semibold">Für immer kostenlos</p>
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex items-center">
                  <CheckSquare className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                  Für 1 Nutzer
                </li>
                <li className="flex items-center">
                  <CheckSquare className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                  Bis zu 3 Projekte gleichzeitig
                </li>
                <li className="flex items-center">
                  <CheckSquare className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                  Alle Grundfunktionen
                </li>
              </ul>
              <Link href="/app" className="w-full bg-slate-100 text-slate-700 py-3 rounded-lg font-semibold hover:bg-slate-200 transition-colors block text-center">
                Kostenlos starten
              </Link>
            </div>

            {/* Premium Plan */}
            <div className="bg-gradient-to-b from-blue-600 to-blue-700 text-white rounded-2xl p-8 shadow-2xl relative flex flex-col ring-2 ring-blue-500/50 shadow-blue-500/40">
               <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black px-4 py-1 rounded-full text-sm font-semibold" style={{ textShadow: '0 0 4px rgba(0,0,0,0.2)'}}>
                  Beta-Angebot
                </span>
              </div>
              <div className="text-center flex-grow">
                <h3 className="text-2xl font-bold mb-2">Premium</h3>
                <p className="text-5xl font-bold mb-1"><ShinyText>Kostenlos</ShinyText></p>
                <p className="text-blue-100 mb-1">für das erste Jahr</p>
                <p className="text-blue-200 mb-6 line-through">danach €59,99 / Monat</p>
              </div>
              <ul className="space-y-3 mb-8 flex-grow text-blue-50">
                <li className="flex items-center">
                  <CheckSquare className="w-5 h-5 text-amber-300 mr-2 flex-shrink-0" />
                  Unbegrenzte Nutzer & Teams
                </li>
                <li className="flex items-center">
                  <CheckSquare className="w-5 h-5 text-amber-300 mr-2 flex-shrink-0" />
                  Unbegrenzte Projekte
                </li>
                <li className="flex items-center">
                  <CheckSquare className="w-5 h-5 text-amber-300 mr-2 flex-shrink-0" />
                  Export-Funktionen & Reports
                </li>
                <li className="flex items-center">
                  <CheckSquare className="w-5 h-5 text-amber-300 mr-2 flex-shrink-0" />
                  Prioritäts-Support
                </li>
              </ul>
              <Link href="/auth/register" className="w-full bg-white text-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-all duration-300 block text-center shadow-lg hover:shadow-xl hover:shadow-white/30">
                Jetzt 1 Jahr kostenlos sichern
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 flex flex-col">
              <div className="text-center flex-grow">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Enterprise</h3>
                <p className="text-4xl font-bold text-slate-800 mb-4">Individuell</p>
                <p className="text-slate-600 mb-6">Für größere Betriebe</p>
              </div>
              <ul className="space-y-3 mb-8 flex-grow">
                 <li className="flex items-center">
                  <CheckSquare className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                  Alle Premium-Funktionen
                </li>
                <li className="flex items-center">
                  <CheckSquare className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                  API-Anbindung
                </li>
                <li className="flex items-center">
                  <CheckSquare className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                  Individuelle Anpassungen
                </li>
                <li className="flex items-center">
                  <CheckSquare className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" />
                  Dedizierter Support
                </li>
              </ul>
              <button className="w-full bg-slate-100 text-slate-700 py-3 rounded-lg font-semibold hover:bg-slate-200 transition-colors">
                Kontakt aufnehmen
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/30 via-blue-600/30 to-slate-900/30 animate-pulse"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(59,130,246,0.15)_0,_transparent_60%)]"></div>

        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ textShadow: '0 0 15px rgba(255, 255, 255, 0.3)' }}>
            Bereit für die digitale Transformation?
          </h2>
          <p className="text-xl text-blue-200 mb-8">
            Starten Sie noch heute und bringen Sie Ihr Handwerksunternehmen auf das nächste Level.
          </p>
          <Link href="/auth/register" className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition-transform duration-300 hover:scale-105 shadow-lg shadow-white/10 hover:shadow-white/30">
            Jetzt kostenlos starten
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Logo />
                <h3 className="text-2xl font-bold text-white">Bauflow</h3>
              </div>
              <p className="text-slate-400">
                Die smarte Web-App für Handwerkerbetriebe
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-slate-200">Produkt</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Preise</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-slate-200">Support</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Dokumentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Kontakt</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-slate-200">Rechtliches</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Datenschutz</a></li>
                <li><a href="#" className="hover:text-white transition-colors">AGB</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Impressum</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2024 Bauflow. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
