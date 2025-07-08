import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const employee_id = searchParams.get('employee_id')
    const month = searchParams.get('month') // Format: YYYY-MM
    
    if (!employee_id || !month) {
      return NextResponse.json({ error: 'Mitarbeiter-ID und Monat sind erforderlich' }, { status: 400 })
    }

    // Get employee data
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select(`
        *,
        companies (
          name,
          address,
          phone,
          email
        )
      `)
      .eq('id', employee_id)
      .single()

    if (employeeError || !employee) {
      return NextResponse.json({ error: 'Mitarbeiter nicht gefunden' }, { status: 404 })
    }

    // Get time entries for the month
    const startDate = `${month}-01`
    const endDate = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0)
      .toISOString().split('T')[0]

    const { data: timeEntries, error: timeError } = await supabase
      .from('time_entries')
      .select(`
        *,
        projects (
          name,
          color
        )
      `)
      .eq('employee_id', employee_id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (timeError) {
      return NextResponse.json({ error: timeError.message }, { status: 500 })
    }

    // Generate HTML for PDF
    const totalHours = timeEntries.reduce((sum, entry) => sum + (entry.total_hours || 0), 0)
    const totalCost = timeEntries.reduce((sum, entry) => sum + (entry.total_cost || 0), 0)

    const html = generateTimesheetHTML(employee, timeEntries, month, totalHours, totalCost)

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="stundenzettel-${employee.first_name}-${employee.last_name}-${month}.html"`
      }
    })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateTimesheetHTML(employee: any, timeEntries: any[], month: string, totalHours: number, totalCost: number): string {
  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ]
  const [year, monthNum] = month.split('-')
  const monthName = monthNames[parseInt(monthNum) - 1]

  return `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Stundenzettel ${employee.first_name} ${employee.last_name} - ${monthName} ${year}</title>
    <style>
        @media print {
            body { margin: 0; font-size: 12px; }
            .page-break { page-break-before: always; }
            .no-print { display: none; }
        }
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        .company-info h1 {
            margin: 0;
            color: #2563eb;
            font-size: 24px;
        }
        .company-info p {
            margin: 5px 0;
            color: #666;
        }
        .timesheet-info {
            text-align: right;
        }
        .timesheet-info h2 {
            margin: 0;
            font-size: 20px;
        }
        .employee-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .employee-section h3 {
            margin: 0 0 15px 0;
            color: #2563eb;
        }
        .employee-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        .employee-field {
            display: flex;
            justify-content: space-between;
        }
        .employee-field strong {
            color: #333;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            background: white;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #2563eb;
            color: white;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .total-row {
            background-color: #e3f2fd !important;
            font-weight: bold;
        }
        .summary {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 40px;
        }
        .summary-box {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
        }
        .summary-box h4 {
            margin: 0 0 15px 0;
            color: #2563eb;
        }
        .summary-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
        }
        .summary-item.total {
            font-weight: bold;
            border-top: 1px solid #ddd;
            padding-top: 10px;
            margin-top: 10px;
        }
        .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 50px;
            margin-top: 50px;
        }
        .signature-box {
            border-top: 2px solid #333;
            padding-top: 10px;
            text-align: center;
        }
        .signature-box p {
            margin: 5px 0;
            font-size: 14px;
        }
        .signature-box .label {
            font-weight: bold;
            color: #2563eb;
        }
        .no-entries {
            text-align: center;
            padding: 40px;
            background: #f8f9fa;
            border-radius: 8px;
            color: #666;
        }
        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2563eb;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        }
        .print-button:hover {
            background: #1d4ed8;
        }
    </style>
</head>
<body>
    <button class="print-button no-print" onclick="window.print()">Drucken / PDF</button>
    
    <div class="header">
        <div class="company-info">
            <h1>${employee.companies?.name || 'Bauflow'}</h1>
            ${employee.companies?.address ? `<p>${employee.companies.address}</p>` : ''}
            ${employee.companies?.phone ? `<p>Tel: ${employee.companies.phone}</p>` : ''}
            ${employee.companies?.email ? `<p>E-Mail: ${employee.companies.email}</p>` : ''}
        </div>
        <div class="timesheet-info">
            <h2>Stundenzettel</h2>
            <p><strong>${monthName} ${year}</strong></p>
            <p>Erstellt am: ${new Date().toLocaleDateString('de-DE')}</p>
        </div>
    </div>

    <div class="employee-section">
        <h3>Mitarbeiter-Informationen</h3>
        <div class="employee-grid">
            <div class="employee-field">
                <span><strong>Name:</strong></span>
                <span>${employee.first_name} ${employee.last_name}</span>
            </div>
            <div class="employee-field">
                <span><strong>Position:</strong></span>
                <span>${employee.role || 'Mitarbeiter'}</span>
            </div>
            <div class="employee-field">
                <span><strong>Stundensatz:</strong></span>
                <span>${employee.hourly_rate?.toFixed(2) || '40.00'} €/h</span>
            </div>
            <div class="employee-field">
                <span><strong>E-Mail:</strong></span>
                <span>${employee.email || '-'}</span>
            </div>
        </div>
    </div>

    ${timeEntries.length === 0 ? `
        <div class="no-entries">
            <h3>Keine Stundeneinträge</h3>
            <p>Für den gewählten Zeitraum wurden keine Arbeitszeiten erfasst.</p>
        </div>
    ` : `
        <table>
            <thead>
                <tr>
                    <th>Datum</th>
                    <th>Projekt</th>
                    <th>Beginn</th>
                    <th>Ende</th>
                    <th>Pause (Min)</th>
                    <th>Stunden</th>
                    <th>Beschreibung</th>
                    <th>Betrag</th>
                </tr>
            </thead>
            <tbody>
                ${timeEntries.map(entry => `
                    <tr>
                        <td>${new Date(entry.date).toLocaleDateString('de-DE')}</td>
                        <td>${entry.projects?.name || '-'}</td>
                        <td>${entry.start_time}</td>
                        <td>${entry.end_time}</td>
                        <td>${entry.break_minutes || 0}</td>
                        <td>${entry.total_hours?.toFixed(2) || '0.00'}</td>
                        <td>${entry.description || '-'}</td>
                        <td>${entry.total_cost?.toFixed(2) || '0.00'} €</td>
                    </tr>
                `).join('')}
                <tr class="total-row">
                    <td colspan="5"><strong>Gesamt</strong></td>
                    <td><strong>${totalHours.toFixed(2)} h</strong></td>
                    <td></td>
                    <td><strong>${totalCost.toFixed(2)} €</strong></td>
                </tr>
            </tbody>
        </table>

        <div class="summary">
            <div class="summary-box">
                <h4>Arbeitszeit-Zusammenfassung</h4>
                <div class="summary-item">
                    <span>Gesamtstunden:</span>
                    <span>${totalHours.toFixed(2)} h</span>
                </div>
                <div class="summary-item">
                    <span>Durchschnitt/Tag:</span>
                    <span>${(totalHours / timeEntries.length).toFixed(2)} h</span>
                </div>
                <div class="summary-item">
                    <span>Arbeitstage:</span>
                    <span>${timeEntries.length}</span>
                </div>
            </div>
            
            <div class="summary-box">
                <h4>Kostenübersicht</h4>
                <div class="summary-item">
                    <span>Stundensatz:</span>
                    <span>${employee.hourly_rate?.toFixed(2) || '40.00'} €/h</span>
                </div>
                <div class="summary-item total">
                    <span>Gesamtbetrag:</span>
                    <span>${totalCost.toFixed(2)} €</span>
                </div>
            </div>
        </div>
    `}

    <div class="signatures">
        <div class="signature-box">
            <p class="label">Mitarbeiter</p>
            <p>${employee.first_name} ${employee.last_name}</p>
            <p>Datum: _______________</p>
        </div>
        <div class="signature-box">
            <p class="label">Vorgesetzter / Geschäftsführer</p>
            <p>_________________________</p>
            <p>Datum: _______________</p>
        </div>
    </div>
</body>
</html>
  `
} 