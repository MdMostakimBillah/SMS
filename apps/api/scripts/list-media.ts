import 'dotenv/config'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { PrismaClient } from '@prisma/client'

const accountId = process.env.R2_ACCOUNT_ID?.trim()
const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim()
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim()
const bucket = process.env.R2_MEDIA_BUCKET?.trim()

async function main() {
  console.log('==============================================')
  console.log(' Cloudflare R2 Media & Database Inspection')
  console.log('==============================================\n')

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    console.error('Error: R2 credentials missing in apps/api/.env (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_MEDIA_BUCKET)')
    process.exit(1)
  }

  console.log(`Bucket:      ${bucket}`)
  console.log(`Account ID:  ${accountId}`)
  console.log(`Endpoint:    https://${accountId}.r2.cloudflarestorage.com\n`)

  // 1. List objects directly from Cloudflare R2
  console.log('--- 1. Physical Objects in Cloudflare R2 Bucket ---')
  const s3 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })

  try {
    const listRes = await s3.send(new ListObjectsV2Command({ Bucket: bucket }))
    const contents = listRes.Contents || []

    if (contents.length === 0) {
      console.log('No objects found in Cloudflare R2 bucket.\n')
    } else {
      console.log(`Found ${contents.length} object(s) in R2:\n`)
      contents.forEach((item, index) => {
        const sizeKb = ((item.Size || 0) / 1024).toFixed(2)
        console.log(`[${index + 1}] Key: ${item.Key}`)
        console.log(`    Size: ${sizeKb} KB | Last Modified: ${item.LastModified?.toISOString() || 'N/A'}`)
      })
      console.log('')
    }
  } catch (err: any) {
    console.warn(`Could not list R2 bucket objects: ${err.message}\n`)
  }

  // 2. Query database media_objects
  console.log('--- 2. Metadata Records in Database (media_objects) ---')
  const prisma = new PrismaClient()
  try {
    const dbRows = await prisma.mediaObject.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        school: {
          select: { name: true, domain: true },
        },
      },
    })

    if (dbRows.length === 0) {
      console.log('No media records in PostgreSQL database.\n')
    } else {
      console.log(`Found ${dbRows.length} database record(s):\n`)
      dbRows.forEach((row, i) => {
        const status = row.deletedAt ? 'DELETED' : 'ACTIVE'
        console.log(`[${i + 1}] ID: ${row.id} (${status})`)
        console.log(`    Category:   ${row.category}`)
        console.log(`    School:     ${row.school?.name || row.schoolId} (${row.school?.domain || 'no domain'})`)
        console.log(`    Object Key: ${row.objectKey}`)
        console.log(`    Size:       ${(row.sizeBytes / 1024).toFixed(2)} KB | MIME: ${row.mimeType}`)
        console.log(`    Public URL: http://localhost:5000/api/media/public/${row.id}`)
        console.log('')
      })
    }
  } catch (err: any) {
    console.warn(`Could not query database: ${err.message}\n`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(console.error)
