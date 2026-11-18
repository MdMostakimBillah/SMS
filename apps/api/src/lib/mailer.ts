import nodemailer, { type Transporter } from 'nodemailer'

const host = process.env.SMTP_HOST || 'smtp.gmail.com'
const port = Number(process.env.SMTP_PORT) || 465
const secure = port === 465
const user = (process.env.SMTP_USER || process.env.GMAIL_USER || '').trim()
const pass = (process.env.SMTP_PASS || process.env.GMAIL_PASS || process.env.GMAIL_APP_PASSWORD || '').trim()
const from = process.env.SMTP_FROM || user || 'EduTech Security <noreply@edutech.local>'

let transporter: Transporter | null = null

if (user && pass) {
  try {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    })
  } catch (err) {
    console.warn('[mailer] Failed to initialize nodemailer transporter:', err)
  }
}

/**
 * Send an OTP verification code via email if SMTP is configured.
 * Returns true if sent, false otherwise.
 */
export async function sendOtpEmail(to: string, code: string, purpose: 'login' | 'reset' = 'login'): Promise<boolean> {
  if (!transporter) {
    return false
  }

  const isLogin = purpose === 'login'
  const subject = isLogin
    ? 'EduTech SMS Super Admin Verification Code'
    : 'EduTech SMS Password Reset Verification Code'

  const text = isLogin
    ? `Your Super Admin login verification code is: ${code}. This code expires in 10 minutes.`
    : `Your password reset verification code is: ${code}. This code expires in 10 minutes.`

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <h2 style="color: #4f46e5; margin-top: 0; font-size: 20px;">EduTech SMS</h2>
          <p style="font-size: 15px; color: #1e293b; margin-bottom: 8px;">
            ${isLogin ? 'Your Super Admin login verification code is:' : 'Your password reset verification code is:'}
          </p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #059669; padding: 16px 0; font-family: monospace;">
            ${code}
          </div>
          <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
            This verification code expires in 10 minutes. If you did not request this login attempt, please secure your account immediately.
          </p>
        </div>
      `,
    })
    return true
  } catch (err) {
    console.error('[mailer] Failed to send verification email:', err instanceof Error ? err.message : err)
    return false
  }
}
