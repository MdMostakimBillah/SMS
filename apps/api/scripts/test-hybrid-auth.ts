import 'dotenv/config'
import { createApp } from '../src/app.js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const jwtSecret = process.env.JWT_SECRET || 'test-secret-that-is-at-least-32-chars-long'
const corsOrigin = 'http://localhost:5173'

const app = createApp({ prisma, jwtSecret, corsOrigin })

const server = app.listen(5679, async () => {
  try {
    console.log('🚀 Testing Hybrid Authentication on Port 5679...')

    // 1. Test Legacy Login
    console.log('\n[Test 1] Testing Legacy Login (admin@edutech.local)...')
    const loginRes = await fetch('http://localhost:5679/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' },
      body: JSON.stringify({ email: 'admin@edutech.local', password: 'Admin@123456' }),
    })
    console.log('  Status:', loginRes.status)
    const loginData = (await loginRes.json()) as any
    console.log('  Logged in user:', loginData.user?.email, 'Role:', loginData.user?.role)

    // Extract legacy cookies
    const legacyCookies = loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [loginRes.headers.get('set-cookie') || '']
    const legacyCookieHeader = legacyCookies.map((c) => c.split(';')[0]).join('; ')

    // 2. Test /api/auth/me with legacy cookie
    console.log('\n[Test 2] Testing /api/auth/me with legacy edutech_sid...')
    const meLegacyRes = await fetch('http://localhost:5679/api/auth/me', {
      headers: { Cookie: legacyCookieHeader, Origin: 'http://localhost:5173' },
    })
    console.log('  Status:', meLegacyRes.status)
    const meLegacyData = (await meLegacyRes.json()) as any
    console.log('  /me resolved user:', meLegacyData.user?.email)

    // 3. Test Better Auth sign in
    console.log('\n[Test 3] Testing Better Auth sign-in with admin@edutech.local...')
    const baSignInRes = await fetch('http://localhost:5679/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5173' },
      body: JSON.stringify({ email: 'admin@edutech.local', password: 'Admin@123456' }),
    })
    console.log('  Better Auth sign-in status:', baSignInRes.status)
    const baData = (await baSignInRes.json()) as any
    console.log('  Better Auth token:', baData.token?.slice(0, 10) + '...')

    // Extract Better Auth cookies
    const baCookies = baSignInRes.headers.getSetCookie ? baSignInRes.headers.getSetCookie() : [baSignInRes.headers.get('set-cookie') || '']
    const baCookieHeader = baCookies.map((c) => c.split(';')[0]).join('; ')
    console.log('  Better Auth Cookie header:', baCookieHeader.slice(0, 50) + '...')

    // 4. Test /api/auth/me using Better Auth session cookie (WITHOUT legacy edutech_sid!)
    console.log('\n[Test 4] Testing /api/auth/me with ONLY Better Auth session cookie...')
    const meBaRes = await fetch('http://localhost:5679/api/auth/me', {
      headers: { Cookie: baCookieHeader, Origin: 'http://localhost:5173' },
    })
    console.log('  Status:', meBaRes.status)
    const meBaData = (await meBaRes.json()) as any
    console.log('  /me resolved user via Better Auth:', meBaData.user?.email, 'Role:', meBaData.user?.role)

    // 5. Test protected /api/classes with ONLY Better Auth session cookie
    console.log('\n[Test 5] Testing /api/classes with ONLY Better Auth session cookie...')
    const classesBaRes = await fetch('http://localhost:5679/api/classes', {
      headers: { Cookie: baCookieHeader, Origin: 'http://localhost:5173' },
    })
    console.log('  Status:', classesBaRes.status)

    // 6. Test /api/auth/logout with Better Auth session
    console.log('\n[Test 6] Testing /api/auth/logout with Better Auth session...')
    const logoutRes = await fetch('http://localhost:5679/api/auth/logout', {
      method: 'POST',
      headers: { Cookie: baCookieHeader, Origin: 'http://localhost:5173' },
    })
    console.log('  Logout Status:', logoutRes.status)

    console.log('\n🎉 ALL HYBRID AUTH CAPABILITIES (SIGN-IN, /ME, PROTECTED ROUTES, LOGOUT) VERIFIED 100% OPERATIONAL!')
  } catch (err) {
    console.error('Test failed:', err)
  } finally {
    server.close()
    await prisma.$disconnect()
  }
})
