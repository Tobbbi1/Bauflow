import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendVerificationEmail(email: string, token: string, firstName: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`
  
  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@bauflow.de',
      to: email,
      subject: 'Bauflow - E-Mail-Adresse bestätigen',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Willkommen bei Bauflow!</h2>
          <p>Hallo ${firstName},</p>
          <p>vielen Dank für Ihre Registrierung bei Bauflow. Bitte bestätigen Sie Ihre E-Mail-Adresse, um Ihr Konto zu aktivieren.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              E-Mail-Adresse bestätigen
            </a>
          </div>
          <p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
          <p style="word-break: break-all; color: #6b7280;">${verificationUrl}</p>
          <p>Dieser Link ist 24 Stunden gültig.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Bauflow - Die digitale Werkzeugkiste für Handwerksbetriebe
          </p>
        </div>
      `
    })
    
    console.log('Verification email sent to:', email)
    return { success: true }
  } catch (error) {
    console.error('Failed to send verification email:', error)
    return { success: false, error }
  }
}

export async function sendEmployeeInvitation(
  email: string, 
  firstName: string, 
  lastName: string, 
  companyName: string, 
  token: string,
  invitedBy: string
) {
  const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/accept-invitation?token=${token}`
  
  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@bauflow.de',
      to: email,
      subject: `Einladung zu ${companyName} bei Bauflow`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Einladung zu Bauflow</h2>
          <p>Hallo ${firstName} ${lastName},</p>
          <p>Sie wurden von ${invitedBy} eingeladen, dem Team von <strong>${companyName}</strong> bei Bauflow beizutreten.</p>
          <p>Bauflow ist eine moderne Projektmanagement-Software für Handwerksbetriebe.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Einladung annehmen
            </a>
          </div>
          <p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
          <p style="word-break: break-all; color: #6b7280;">${invitationUrl}</p>
          <p>Diese Einladung ist 7 Tage gültig.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Bauflow - Die digitale Werkzeugkiste für Handwerksbetriebe
          </p>
        </div>
      `
    })
    
    console.log('Employee invitation email sent to:', email)
    return { success: true }
  } catch (error) {
    console.error('Failed to send employee invitation email:', error)
    return { success: false, error }
  }
}

export async function sendPasswordResetEmail(email: string, token: string, firstName: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${token}`
  
  try {
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@bauflow.de',
      to: email,
      subject: 'Bauflow - Passwort zurücksetzen',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">Passwort zurücksetzen</h2>
          <p>Hallo ${firstName},</p>
          <p>Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Passwort zurücksetzen
            </a>
          </div>
          <p>Oder kopieren Sie diesen Link in Ihren Browser:</p>
          <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
          <p>Dieser Link ist 1 Stunde gültig.</p>
          <p>Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">
            Bauflow - Die digitale Werkzeugkiste für Handwerksbetriebe
          </p>
        </div>
      `
    })
    
    console.log('Password reset email sent to:', email)
    return { success: true }
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    return { success: false, error }
  }
} 