# Bauflow - Projektmanagement für Handwerksbetriebe

Bauflow ist eine moderne, browserbasierte Projektmanagement-Software speziell entwickelt für kleine Handwerksbetriebe und selbstständige Handwerker.

## 🚀 Features

- **Dashboard**: Übersicht über alle Projekte, Aufgaben und Termine
- **Baustellenmanagement**: Digitale Organisation von Projekten mit Bautagebuch
- **Aufgabenmanagement**: Zuweisung und Verfolgung von Aufgaben im Team
- **Kalender & Planung**: Drag & Drop Mitarbeiterplanung
- **Zeiterfassung**: Projektbezogene Zeiterfassung mit Timer
- **Offline-Funktion**: Arbeiten auch ohne Internetverbindung
- **Materialmanagement**: Verwaltung von Materialien und Beständen

## 🏗️ Technologie-Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Styling**: Tailwind CSS mit Lucide React Icons
- **Authentifizierung**: Custom Auth mit bcryptjs

## 📋 Voraussetzungen

- Node.js 18+ 
- npm oder yarn
- Supabase-Konto

## 🛠️ Installation

1. **Repository klonen**
   ```bash
   git clone <repository-url>
   cd bauplaner
   ```

2. **Abhängigkeiten installieren**
   ```bash
   npm install
   ```

3. **Umgebungsvariablen konfigurieren**
   Erstellen Sie eine `.env.local` Datei:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=ihre_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=ihr_supabase_anon_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Datenbank einrichten**
   - Führen Sie das SQL-Schema aus `bauflow-schema.sql` in Ihrer Supabase-Datenbank aus
   - Das Schema erstellt alle notwendigen Tabellen, Indizes und RLS-Policies

5. **Entwicklungsserver starten**
```bash
npm run dev
   ```

## 🗄️ Datenbankstruktur

### Haupttabellen

- **companies**: Firmeninformationen
- **users**: Benutzer mit Authentifizierung und Rollen
- **projects**: Baustellen/Projekte
- **tasks**: Aufgaben innerhalb von Projekten
- **time_entries**: Zeiterfassung
- **materials**: Materialverwaltung
- **employee_invitations**: Mitarbeiter-Einladungen

### Benutzerrollen

- **admin**: Vollzugriff, kann Benutzer verwalten
- **manager**: Projekt- und Aufgabenverwaltung
- **employee**: Aufgaben bearbeiten, Zeiten erfassen

## 🔐 Authentifizierungssystem

### Registrierung
1. Benutzer registriert sich mit Firmendaten
2. E-Mail-Bestätigung wird gesendet
3. Nach Bestätigung kann sich der Benutzer anmelden
4. Erste Registrierung wird automatisch Admin der Firma

### Mitarbeiter-Einladung
1. Admin lädt Mitarbeiter per E-Mail ein
2. Mitarbeiter erhält Einladungslink
3. Nach Annahme der Einladung kann sich Mitarbeiter registrieren
4. Mitarbeiter wird automatisch der Firma zugeordnet

### E-Mail-Bestätigung
- Registrierung erfordert E-Mail-Bestätigung
- Token ist 24 Stunden gültig
- Einladungen sind 7 Tage gültig

## 📁 Projektstruktur

```
src/
├── app/
│   ├── auth/                 # Authentifizierungsseiten
│   │   ├── login/           # Anmeldung
│   │   ├── register/        # Registrierung
│   │   └── verify/          # E-Mail-Bestätigung
│   ├── api/                 # API-Routen
│   │   └── auth/           # Authentifizierungs-APIs
│   └── app/                # Hauptanwendung
├── components/             # React-Komponenten
├── lib/                   # Utilities und Konfiguration
│   └── supabase/         # Supabase-Client
└── types/                # TypeScript-Definitionen
```

## 🔧 API-Endpunkte

### Authentifizierung
- `POST /api/auth/register` - Benutzerregistrierung
- `POST /api/auth/login` - Benutzeranmeldung
- `POST /api/auth/verify` - E-Mail-Bestätigung

### Mitarbeiterverwaltung
- `POST /api/employees/invite` - Mitarbeiter einladen

## 🎨 Design-System

- **Farben**: Blau als Hauptfarbe, mit goldenen Akzenten für Beta-Phase
- **Icons**: Lucide React für konsistente Iconographie
- **Komponenten**: Wiederverwendbare UI-Komponenten mit Tailwind CSS
- **Responsive**: Mobile-first Design

## 🚀 Deployment

### Vercel (Empfohlen)
1. Projekt auf GitHub pushen
2. In Vercel importieren
3. Umgebungsvariablen setzen
4. Deploy

### Andere Plattformen
- Netlify
- Railway
- DigitalOcean App Platform

## 📝 Entwicklung

### Code-Stil
- TypeScript für Typsicherheit
- ESLint für Code-Qualität
- Prettier für Formatierung

### Testing
```bash
npm run test        # Unit-Tests
npm run test:e2e    # End-to-End-Tests
```

## 🔒 Sicherheit

- Passwort-Hashing mit bcryptjs
- Row Level Security (RLS) in Supabase
- E-Mail-Bestätigung für Registrierung
- Token-basierte Einladungen
- CSRF-Schutz

## 📞 Support

Für Fragen und Support:
- E-Mail: support@bauflow.de
- Dokumentation: [docs.bauflow.de](https://docs.bauflow.de)

## 📄 Lizenz

Dieses Projekt ist proprietär und gehört zu Bauflow.

---

**Bauflow** - Die digitale Werkzeugkiste für Handwerksbetriebe 🛠️
