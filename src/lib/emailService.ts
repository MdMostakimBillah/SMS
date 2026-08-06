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

export async function sendVerificationCode(email: string, code: string): Promise<{ success: boolean; simulated: boolean }> {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    return { success: true, simulated: true }
  }

  try {
    initEmailJS()
    await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_email: email,
        verification_code: code,
        school_name: 'EduTech SMS',
      }
    )
    return { success: true, simulated: false }
  } catch {
    return { success: true, simulated: true }
  }
}
