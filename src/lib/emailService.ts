import emailjs from '@emailjs/browser'

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_xqctcri'
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_f83p6rg'
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '61CbgIQyFjPYSScyg'

let initialized = false

function initEmailJS() {
  if (!initialized && PUBLIC_KEY) {
    emailjs.init(PUBLIC_KEY)
    initialized = true
  }
}

export async function sendVerificationCode(
  email: string,
  code: string
): Promise<{ success: boolean; simulated: boolean; error?: string }> {
  // Missing config → intentional demo mode (show code on screen)
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    return { success: true, simulated: true }
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
          message: 'Your verification code for EduTech SMS registration. This code expires in 10 minutes.',
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
