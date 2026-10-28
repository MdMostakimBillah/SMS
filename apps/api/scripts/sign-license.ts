/**
 * Offline license signer — issues signed license keys for EduTech (Mode B).
 *
 * Run with tsx (Node ≥18):
 *   LICENSE_SECRET=<secret> npx tsx scripts/sign-license.ts \
 *     --slug=demo-school --plan=pro --days=365 --features=classes,exams
 *
 * The secret must match the LICENSE_SECRET used by the API and the
 * VITE_LICENSE_SECRET baked into the frontend build.
 */

import { signLicense, type LicensePlan } from '../src/lib/license.js'

function arg(name: string): string | undefined {
  const hit = process.argv.slice(2).find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : undefined
}

const slug = arg('slug')
const plan = (arg('plan') ?? 'basic') as LicensePlan
const secret = process.env.LICENSE_SECRET || arg('secret')
const days = Number(arg('days') ?? '365')
const features = (arg('features') ?? '').split(',').map((s) => s.trim()).filter(Boolean)

if (!slug) {
  console.error('Usage: --slug=<institution-slug> [--plan=basic|pro|enterprise] [--days=365] [--features=a,b]')
  process.exit(1)
}
if (!secret) {
  console.error('LICENSE_SECRET env var (or --secret) is required.')
  process.exit(1)
}
if (!Number.isFinite(days) || days <= 0) {
  console.error('--days must be a positive number.')
  process.exit(1)
}

const now = Date.now()
const key = signLicense(
  {
    slug,
    plan,
    issuedAt: now,
    expiresAt: now + days * 24 * 60 * 60 * 1000,
    features,
  },
  secret
)

console.log('License key issued.')
console.log(`  Slug:     ${slug}`)
console.log(`  Plan:     ${plan}`)
console.log(`  Days:     ${days}`)
console.log(`  Features: ${features.join(', ') || '(none)'}`)
console.log(`  Expires:  ${new Date(now + days * 24 * 60 * 60 * 1000).toISOString()}`)
console.log('')
console.log(key)
