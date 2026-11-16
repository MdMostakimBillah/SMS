import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import crypto from 'node:crypto'

const prisma = new PrismaClient()

async function syncToNeonAuth() {
  console.log('====================================================')
  console.log('🔄 Syncing Public Accounts to neon_auth Schema')
  console.log('====================================================')

  // 1. Sync Schools -> neon_auth.organization
  const schools = await prisma.school.findMany()
  console.log(`\n[1/3] Syncing ${schools.length} Schools to neon_auth.organization...`)
  for (const s of schools) {
    const slug = (s.domain || s.id).toLowerCase().replace(/[^a-z0-9-]/g, '-')
    await prisma.$executeRawUnsafe(`
      INSERT INTO neon_auth.organization ("id", "name", "slug", "logo", "createdAt")
      VALUES ($1::uuid, $2, $3, $4, $5)
      ON CONFLICT ("id") DO UPDATE SET
        "name" = EXCLUDED."name",
        "slug" = EXCLUDED."slug",
        "logo" = EXCLUDED."logo";
    `, s.id, s.name, slug, s.logo || null, s.createdAt || new Date())
    console.log(`  ✓ Synced Organization: ${s.name} (${slug})`)
  }

  // 2. Sync Users -> neon_auth.user & neon_auth.account
  const users = await prisma.user.findMany()
  console.log(`\n[2/3] Syncing ${users.length} Users to neon_auth.user & neon_auth.account...`)
  for (const u of users) {
    const displayName = u.name || u.email.split('@')[0]
    await prisma.$executeRawUnsafe(`
      INSERT INTO neon_auth.user ("id", "name", "email", "emailVerified", "image", "role", "banned", "createdAt", "updatedAt")
      VALUES ($1::uuid, $2, $3, true, $4, $5, $6, $7, $8)
      ON CONFLICT ("id") DO UPDATE SET
        "name" = EXCLUDED."name",
        "email" = EXCLUDED."email",
        "role" = EXCLUDED."role",
        "banned" = EXCLUDED."banned",
        "updatedAt" = EXCLUDED."updatedAt";
    `, u.id, displayName, u.email, u.avatar || null, u.role, !u.isActive, u.createdAt, u.updatedAt)

    // Account (credential password) - using u.id as primary account id and accountId
    await prisma.$executeRawUnsafe(`
      INSERT INTO neon_auth.account ("id", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt")
      VALUES ($1::uuid, $1::uuid, 'credential', $1::uuid, $2, $3, $4)
      ON CONFLICT ("id") DO UPDATE SET
        "accountId" = EXCLUDED."accountId",
        "password" = EXCLUDED."password",
        "updatedAt" = EXCLUDED."updatedAt";
    `, u.id, u.passwordHash, u.createdAt, u.updatedAt)

    console.log(`  ✓ Synced User & Account: ${u.email} [${u.role}]`)
  }

  // 3. Sync User School Membership -> neon_auth.member
  console.log(`\n[3/3] Syncing School Memberships to neon_auth.member...`)
  for (const u of users) {
    if (u.schoolId) {
      const memberId = crypto.randomUUID()
      const memberRole = u.role === 'super_admin' ? 'owner' : u.role === 'school_admin' ? 'admin' : 'member'
      await prisma.$executeRawUnsafe(`
        DELETE FROM neon_auth.member WHERE "organizationId" = $1::uuid AND "userId" = $2::uuid;
      `, u.schoolId, u.id)
      await prisma.$executeRawUnsafe(`
        INSERT INTO neon_auth.member ("id", "organizationId", "userId", "role", "createdAt")
        VALUES ($1::uuid, $2::uuid, $3::uuid, $4, NOW());
      `, memberId, u.schoolId, u.id, memberRole)
      console.log(`  ✓ Linked Member: ${u.email} -> School ID ${u.schoolId} as ${memberRole}`)
    }
  }

  // Verify Counts
  console.log('\n====================================================')
  console.log('🔍 VERIFYING NEON_AUTH COUNTS')
  console.log('====================================================')
  const [orgCount] = await prisma.$queryRaw<Array<{ count: bigint }>>`SELECT count(*) FROM neon_auth.organization;`
  const [userCount] = await prisma.$queryRaw<Array<{ count: bigint }>>`SELECT count(*) FROM neon_auth.user;`
  const [accountCount] = await prisma.$queryRaw<Array<{ count: bigint }>>`SELECT count(*) FROM neon_auth.account;`
  const [memberCount] = await prisma.$queryRaw<Array<{ count: bigint }>>`SELECT count(*) FROM neon_auth.member;`

  console.log(`  ✓ Organizations in neon_auth: ${orgCount.count}`)
  console.log(`  ✓ Users in neon_auth: ${userCount.count}`)
  console.log(`  ✓ Accounts in neon_auth: ${accountCount.count}`)
  console.log(`  ✓ Members in neon_auth: ${memberCount.count}`)
  console.log('\n🎉 SUCCESS: All accounts and schools synchronized with neon_auth!')
}

syncToNeonAuth()
  .catch((err) => {
    console.error('Sync failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
