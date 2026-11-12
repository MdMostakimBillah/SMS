import emailjs from '@emailjs/browser'

// EmailJS config comes ONLY from deployment env (VITE_*). No hardcoded
// fallbacks: an unset config intentionally puts the service in demo mode
// (verification code shown on screen) instead of shipping someone's keys.
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || ''
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || ''
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || ''

let initialized = false

function initEmailJS() {
  if (!initialized && PUBLIC_KEY) {
    emailjs.init(PUBLIC_KEY)
    initialized = true
  }
}

export async function sendVerificationCode(
  email: string,
  code: string,
  purpose: 'registration' | 'email_change' | 'password_change' = 'registration'
): Promise<{ success: boolean; simulated: boolean; error?: string }> {
  // Missing config → intentional demo mode (show code on screen)
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    return { success: true, simulated: true }
  }

  let message = `Your verification code for EduTech SMS is ${code}. This code expires in 10 minutes.`
  if (purpose === 'email_change') {
    message = `Your verification code to update your EduTech SMS email address is ${code}. This code expires in 10 minutes.`
  } else if (purpose === 'password_change') {
    message = `Your verification code to change your EduTech SMS password is ${code}. This code expires in 10 minutes.`
  }

  // Retry up to 3 times with increasing delay
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      initEmailJS()
      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
          to_email: email,
          from_name: 'EduTech SMS',
          verification_code: code,
          message,
          reply_to: email,
        }
      )
      return { success: true, simulated: false }
    } catch (err) {
      console.error(`EmailJS attempt ${attempt + 1} failed:`, err)
      // Wait before retrying: 2s, 4s, then give up
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)))
      }
    }
  }

  return { success: false, simulated: false, error: 'Failed to send verification email. Please check your email address and try again.' }
}

export async function sendPasswordNotification(
  email: string,
  newPassword?: string,
  customMessage?: string
): Promise<{ success: boolean; simulated: boolean; error?: string }> {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    return { success: true, simulated: true }
  }

  const message = customMessage || (
    newPassword
      ? `Your EduTech SMS account password has been updated successfully.\nYour new password is: ${newPassword}\nIf you did not request this change, please contact your institution administrator immediately.`
      : `Your EduTech SMS account password has been updated successfully.\nIf you did not request this change, please contact your institution administrator immediately.`
  )

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      initEmailJS()
      await emailjs.send(
        SERVICE_ID,
        TEMPLATE_ID,
        {
          to_email: email,
          email: email,
          from_name: 'EduTech SMS Security',
          verification_code: newPassword || 'CONFIRMED',
          password: newPassword || '',
          new_password: newPassword || '',
          message,
          reply_to: email,
        }
      )
      return { success: true, simulated: false }
    } catch (err) {
      console.error(`EmailJS attempt ${attempt + 1} failed:`, err)
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)))
      }
    }
  }

  return { success: false, simulated: false, error: 'Failed to send password notification email.' }
}

export async function sendEmailChangeNotification(
  oldEmail: string,
  newEmail: string
): Promise<{ success: boolean; simulated: boolean; error?: string }> {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    return { success: true, simulated: true }
  }

  const message = `Security Notice: The email address for your EduTech SMS account has been changed from ${oldEmail} to ${newEmail}. If you did not make this change, please contact your administrator immediately.`

  try {
    initEmailJS()
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_email: oldEmail,
        from_name: 'EduTech SMS Security',
        verification_code: 'EMAIL_CHANGED',
        message,
        reply_to: newEmail,
      }
    )
    return { success: true, simulated: false }
  } catch (err) {
    console.error('Email change notification failed:', err)
    return { success: false, simulated: false, error: 'Failed to send notification' }
  }
}
