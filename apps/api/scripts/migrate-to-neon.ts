import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const SOURCE_URL =
  process.env.OLD_DATABASE_URL ||
  'postgresql://postgres.bbswdxerlqnvtlzxukxk:22880939n210.M@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true'

const DEST_URL =
  process.env.DIRECT_URL ||
  'postgresql://neondb_owner:npg_2LBHesVNClo3@ep-bold-salad-az37hp25.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'

console.log('Source DB Host:', new URL(SOURCE_URL).host)
console.log('Destination DB Host:', new URL(DEST_URL).host)

const sourcePrisma = new PrismaClient({
  datasources: { db: { url: SOURCE_URL } },
})

const destPrisma = new PrismaClient({
  datasources: { db: { url: DEST_URL } },
})

async function runMigration() {
  console.log('====================================================')
  console.log('🚀 Starting Data Migration: Supabase -> Neon')
  console.log('====================================================')

  // 1. Schools
  console.log('\n[1/10] Migrating Schools...')
  const schools = await sourcePrisma.school.findMany()
  console.log(`Found ${schools.length} schools in Supabase.`)
  for (const school of schools) {
    await destPrisma.school.upsert({
      where: { id: school.id },
      create: school,
      update: school,
    })
    console.log(`  ✓ Synced School: ${school.name} (${school.domain || school.id})`)
  }

  // 2. Departments
  console.log('\n[2/10] Migrating Departments...')
  const depts = await sourcePrisma.department.findMany()
  console.log(`Found ${depts.length} departments in Supabase.`)
  for (const dept of depts) {
    await destPrisma.department.upsert({
      where: { id: dept.id },
      create: dept,
      update: dept,
    })
  }
  console.log(`  ✓ Synced ${depts.length} departments`)

  // 3. Designations
  console.log('\n[3/10] Migrating Designations...')
  const desigs = await sourcePrisma.designation.findMany()
  console.log(`Found ${desigs.length} designations in Supabase.`)
  for (const desig of desigs) {
    await destPrisma.designation.upsert({
      where: { id: desig.id },
      create: desig,
      update: desig,
    })
  }
  console.log(`  ✓ Synced ${desigs.length} designations`)

  // 4. Subjects
  console.log('\n[4/10] Migrating Subjects...')
  const subjects = await sourcePrisma.subject.findMany()
  console.log(`Found ${subjects.length} subjects in Supabase.`)
  for (const sub of subjects) {
    await destPrisma.subject.upsert({
      where: { id: sub.id },
      create: sub,
      update: sub,
    })
  }
  console.log(`  ✓ Synced ${subjects.length} subjects`)

  // 5. Users
  console.log('\n[5/10] Migrating Users (Preserving Argon2 Password Hashes)...')
  const users = await sourcePrisma.user.findMany()
  console.log(`Found ${users.length} users in Supabase.`)
  for (const user of users) {
    await destPrisma.user.upsert({
      where: { id: user.id },
      create: user,
      update: user,
    })
    console.log(`  ✓ Synced User: ${user.email} [${user.role}]`)
  }

  // 6. Teachers
  console.log('\n[6/10] Migrating Teachers...')
  const teachers = await sourcePrisma.teacher.findMany()
  console.log(`Found ${teachers.length} teachers in Supabase.`)
  for (const teacher of teachers) {
    await destPrisma.teacher.upsert({
      where: { id: teacher.id },
      create: teacher,
      update: teacher,
    })
  }
  console.log(`  ✓ Synced ${teachers.length} teachers`)

  // 7. Students
  console.log('\n[7/10] Migrating Students...')
  const students = await sourcePrisma.student.findMany()
  console.log(`Found ${students.length} students in Supabase.`)
  for (const student of students) {
    await destPrisma.student.upsert({
      where: { id: student.id },
      create: student,
      update: student,
    })
  }
  console.log(`  ✓ Synced ${students.length} students`)

  // 8. Sessions (Active JWT logins)
  console.log('\n[8/10] Migrating Active Sessions...')
  const sessions = await sourcePrisma.session.findMany()
  console.log(`Found ${sessions.length} sessions in Supabase.`)
  for (const sess of sessions) {
    await destPrisma.session.upsert({
      where: { id: sess.id },
      create: sess,
      update: sess,
    })
  }
  console.log(`  ✓ Synced ${sessions.length} active sessions`)

  // 9. Media Objects (Metadata pointing to Cloudflare R2)
  console.log('\n[9/10] Migrating Media Objects Metadata...')
  const media = await sourcePrisma.mediaObject.findMany()
  console.log(`Found ${media.length} media records in Supabase.`)
  for (const m of media) {
    await destPrisma.mediaObject.upsert({
      where: { id: m.id },
      create: m,
      update: m,
    })
  }
  console.log(`  ✓ Synced ${media.length} media records`)

  // 10. System Config & Notices
  console.log('\n[10/10] Migrating System Config & Notices...')
  const configs = await sourcePrisma.systemConfig.findMany()
  for (const cfg of configs) {
    await destPrisma.systemConfig.upsert({
      where: { key: cfg.key },
      create: cfg,
      update: cfg,
    })
  }
  const noticeCats = await sourcePrisma.noticeCategory.findMany()
  for (const nc of noticeCats) {
    await destPrisma.noticeCategory.upsert({
      where: { id: nc.id },
      create: nc,
      update: nc,
    })
  }
  const notices = await sourcePrisma.notice.findMany()
  for (const n of notices) {
    await destPrisma.notice.upsert({
      where: { id: n.id },
      create: n,
      update: n,
    })
  }

  // AUDIT & VERIFICATION
  console.log('\n====================================================')
  console.log('🔍 VERIFYING RECORD COUNTS')
  console.log('====================================================')

  const [
    sourceCounts,
    destCounts,
  ] = await Promise.all([
    Promise.all([
      sourcePrisma.school.count(),
      sourcePrisma.user.count(),
      sourcePrisma.teacher.count(),
      sourcePrisma.student.count(),
      sourcePrisma.department.count(),
      sourcePrisma.subject.count(),
      sourcePrisma.designation.count(),
      sourcePrisma.session.count(),
      sourcePrisma.mediaObject.count(),
    ]),
    Promise.all([
      destPrisma.school.count(),
      destPrisma.user.count(),
      destPrisma.teacher.count(),
      destPrisma.student.count(),
      destPrisma.department.count(),
      destPrisma.subject.count(),
      destPrisma.designation.count(),
      destPrisma.session.count(),
      destPrisma.mediaObject.count(),
    ]),
  ])

  const tableNames = [
    'Schools',
    'Users',
    'Teachers',
    'Students',
    'Departments',
    'Subjects',
    'Designations',
    'Sessions',
    'MediaObjects',
  ]

  let allMatch = true
  tableNames.forEach((name, idx) => {
    const src = sourceCounts[idx]
    const dst = destCounts[idx]
    const match = src === dst
    if (!match) allMatch = false
    console.log(`  ${match ? '✓' : '✗'} ${name}: Supabase=${src} | Neon=${dst}`)
  })

  if (allMatch) {
    console.log('\n🎉 SUCCESS: All accounts, institutions, and data have been 100% migrated to Neon!')
  } else {
    console.error('\n⚠️ WARNING: Some record counts did not match.')
    process.exit(1)
  }
}

runMigration()
  .catch((err) => {
    console.error('\n❌ Migration failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await Promise.all([sourcePrisma.$disconnect(), destPrisma.$disconnect()])
  })
