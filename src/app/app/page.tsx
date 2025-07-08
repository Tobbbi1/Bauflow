'use client'

import Link from 'next/link'
import { Calendar, Building2, Users, Clock, Plus, TrendingUp } from 'lucide-react'

export default function AppDashboard() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600">Überblick über Ihre Baustellen, Termine und Mitarbeiter</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link
          href="/app/projects/create"
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
            <Plus className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Neue Baustelle</h3>
          <p className="text-slate-600 text-sm">Erstellen Sie ein neues Bauprojekt.</p>
        </Link>

        <Link
          href="/app/calendar"
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
            <Calendar className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Kalender</h3>
          <p className="text-slate-600 text-sm">Termine und Baustellenplanung.</p>
        </Link>

        <Link
          href="/app/employees"
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
            <Users className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Mitarbeiter</h3>
          <p className="text-slate-600 text-sm">Team verwalten und organisieren.</p>
        </Link>

        <Link
          href="/app/timesheets"
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-orange-200 transition-colors">
            <Clock className="w-6 h-6 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Stundenzettel</h3>
          <p className="text-slate-600 text-sm">Arbeitszeiten erfassen und verwalten.</p>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Aktive Baustellen</p>
              <p className="text-3xl font-bold text-slate-900">3</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>+2 diese Woche</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Termine heute</p>
              <p className="text-3xl font-bold text-slate-900">5</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-slate-600">
            <span>3 laufend, 2 geplant</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Mitarbeiter</p>
              <p className="text-3xl font-bold text-slate-900">4</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-slate-600">
            <span>Alle verfügbar</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">Stunden diese Woche</p>
              <p className="text-3xl font-bold text-slate-900">156</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>+12h zur Vorwoche</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Projects */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Aktive Baustellen</h3>
            <Link
              href="/app/projects"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Alle anzeigen →
            </Link>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">Badezimmer Renovierung</p>
                <p className="text-sm text-slate-600">Familie Muster • 3 Termine diese Woche</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">75%</p>
                <p className="text-sm text-slate-600">Fortschritt</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">Büro Umbau</p>
                <p className="text-sm text-slate-600">Firma ABC GmbH • 2 Termine geplant</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">45%</p>
                <p className="text-sm text-slate-600">Fortschritt</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">Küche Modernisierung</p>
                <p className="text-sm text-slate-600">Restaurant Zur Post • Startet morgen</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">10%</p>
                <p className="text-sm text-slate-600">Fortschritt</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Nächste Termine</h3>
            <Link
              href="/app/calendar"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Kalender anzeigen →
            </Link>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white">
                  MM
                </div>
                <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white">
                  AS
                </div>
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">Fliesen verlegen</p>
                <p className="text-sm text-slate-600">Badezimmer Renovierung</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">Heute</p>
                <p className="text-sm text-slate-600">09:00 - 13:00</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white">
                  PW
                </div>
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">Elektrik prüfen</p>
                <p className="text-sm text-slate-600">Büro Umbau</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">Morgen</p>
                <p className="text-sm text-slate-600">10:00 - 13:00</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white">
                  MM
                </div>
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white">
                  LM
                </div>
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">Küchenmontage</p>
                <p className="text-sm text-slate-600">Küche Modernisierung</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">Übermorgen</p>
                <p className="text-sm text-slate-600">08:00 - 14:00</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 