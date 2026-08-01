import emailjs from '@emailjs/browser'

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

export async function sendVerificationCode(email: string, code: string): Promise<{ success: boolean; simulated: boolean }> {
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
    console.warn('EmailJS not configured. Using simulated code:', code)
    return { success: true, simulated: true }
  }

  try {
    initEmailJS()
    const response = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      {
        to_email: email,
        verification_code: code,
        school_name: 'EduTech SMS',
      }
    )
    console.log('EmailJS response:', response)
    return { success: true, simulated: false }
  } catch (err) {
    console.error('EmailJS error:', err)
    return { success: false, simulated: false }
  }
}
