import { createAuthClient } from 'better-auth/react'
import { organizationClient } from 'better-auth/client/plugins'

const apiBase =
  (typeof window !== 'undefined' && import.meta.env.VITE_API_URL)
    ? import.meta.env.VITE_API_URL
    : (typeof window !== 'undefined' ? window.location.origin : '')

export const authClient = createAuthClient({
  baseURL: apiBase,
  basePath: '/api/auth',
  plugins: [
    organizationClient(),
  ],
})

export const {
  signIn,
  signOut,
  signUp,
  useSession,
} = authClient
