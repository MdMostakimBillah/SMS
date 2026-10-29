/**
 * Bootstrap script: creates (or updates) the super administrator account.
 *
 * - Credentials come from server-side env vars only: SUPER_ADMIN_EMAIL / SUPER_ADMIN_PASSWORD
 * - The password is hashed with Argon2id and stored one-way; plaintext is never persisted or logged
 * - Idempotent: existing super admin is left untouched unless --force is passed
 * - Refuses to run when required env vars are missing
 *
 * Usage: npm run seed            (create if missing)
 *        npm run seed -- --force (rotate password / re-sync email)
 */
import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { PrismaClient, type UserRole } from '@prisma/client'
import { hash } from '@node-rs/argon2'

const SUPER_ADMIN_ROLE: UserRole = 'super_admin'

function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    console.error(`[seed] FATAL: ${name} is not set. Set it in apps/api/.env (see .env.example).`)
    process.exit(1)
  }
  return value
}

async function main() {
  const email = requireEnv('SUPER_ADMIN_EMAIL').toLowerCase()
  const password = requireEnv('SUPER_ADMIN_PASSWORD')
  const force = process.argv.includes('--force')

  if (password.length < 12) {
    console.error('[seed] FATAL: SUPER_ADMIN_PASSWORD must be at least 12 characters.')
    process.exit(1)
  }

  const prisma = new PrismaClient()
  try {
    const existingByEmail = await prisma.user.findUnique({ where: { email } })
    const existingSuperAdmin = await prisma.user.findFirst({ where: { role: SUPER_ADMIN_ROLE } })

    if (existingByEmail && existingByEmail.role !== SUPER_ADMIN_ROLE && !force) {
      console.error(`[seed] FATAL: ${email} already exists with role "${existingByEmail.role}". Choose another SUPER_ADMIN_EMAIL.`)
      process.exit(1)
    }

    if ((existingByEmail || existingSuperAdmin) && !force) {
      const target = existingByEmail ?? existingSuperAdmin!
      console.log(`[seed] Super admin already exists (id=${target.id}, email=${target.email}). Use --force to rotate credentials.`)
      return
    }

    const passwordHash = await hash(password, {
      algorithm: 2, // Argon2id
      memoryCost: 64 * 1024, // 64 MB
      timeCost: 3,
      parallelism: 1,
    })

    const defaultSchool = await prisma.school.findFirst({
      where: { OR: [{ domain: 'edutech' }, { domain: 'main' }] },
      select: { id: true },
    })
    const defaultSchoolId = defaultSchool?.id ?? null

    if (existingByEmail) {
      await prisma.user.update({
        where: { id: existingByEmail.id },
        data: { email, passwordHash, role: SUPER_ADMIN_ROLE, schoolId: existingByEmail.schoolId ?? defaultSchoolId, isActive: true },
      })
      console.log(`[seed] Super admin credentials rotated (id=${existingByEmail.id}, email=${email}).`)
    } else {
      if (existingSuperAdmin) {
        console.log(`[seed] Note: a different super admin already exists (id=${existingSuperAdmin.id}). Creating requested account as well.`)
      }
      const created = await prisma.user.create({
        data: {
          id: randomUUID(),
          email,
          passwordHash,
          name: 'Super Admin',
          role: SUPER_ADMIN_ROLE,
          schoolId: defaultSchoolId,
          isActive: true,
        },
      })
      console.log(`[seed] Super admin created (id=${created.id}, email=${email}).`)
    }
    console.log('[seed] Password stored as an Argon2id hash. It cannot be read back; rotate with --force if forgotten.')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((err) => {
  console.error('[seed] Failed:', err instanceof Error ? err.message : err)
  process.exit(1)
})
