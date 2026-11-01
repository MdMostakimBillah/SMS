import { Router, type Response } from 'express'
import crypto from 'node:crypto'
import JSZip from 'jszip'
import type { PrismaClient } from '@prisma/client'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'

export function backupRouter(prisma: PrismaClient, jwtSecret: string) {
  const router = Router()

  /**
   * Status endpoint: reports database health, record counts, and Telegram bot configuration status.
   */
  router.get('/status', requireAuth(prisma, jwtSecret), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const isSuper = req.userRole === 'super_admin'
      const schoolFilter = isSuper ? {} : { schoolId: req.schoolId ?? '' }

      const [schoolsCount, teachersCount, studentsCount, departmentsCount, noticesCount] = await Promise.all([
        isSuper ? prisma.school.count() : 1,
        prisma.teacher.count({ where: schoolFilter }),
        prisma.student.count({ where: schoolFilter }),
        prisma.department.count({ where: schoolFilter }),
        prisma.notice.count({ where: schoolFilter }),
      ])

      const envBotConfigured = Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID)

      res.json({
        database: 'connected',
        timestamp: new Date().toISOString(),
        telegramConfigured: envBotConfigured,
        counts: {
          schools: schoolsCount,
          teachers: teachersCount,
          students: studentsCount,
          departments: departmentsCount,
          notices: noticesCount,
        },
      })
    } catch (err) {
      console.error('[backup] status failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /**
   * Test Telegram connection: verifies token and chat ID.
   */
  router.post(
    '/telegram/test',
    requireAuth(prisma, jwtSecret),
    requireRole('super_admin', 'school_admin', 'hr_admin'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const botToken = (req.body?.botToken || process.env.TELEGRAM_BOT_TOKEN || '').trim()
        const chatId = (req.body?.chatId || process.env.TELEGRAM_CHAT_ID || '').trim()

        if (!botToken || !chatId) {
          return res.status(400).json({
            success: false,
            error: 'Telegram Bot Token and Chat ID are required.',
          })
        }

        // Verify bot token with getMe
        const meRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`)
        const meData = (await meRes.json()) as { ok: boolean; result?: { username: string; first_name: string }; description?: string }

        if (!meData.ok) {
          return res.status(400).json({
            success: false,
            error: meData.description || 'Invalid Telegram Bot Token.',
          })
        }

        // Send a test ping message
        const pingText = `✅ *EduTech SMS — Telegram Test Alert*\n\n` +
          `🤖 Bot: @${meData.result?.username}\n` +
          `📅 Timestamp: \`${new Date().toISOString()}\`\n` +
          `📡 Status: Connected & ready to receive automated database backups.`

        const sendRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: pingText,
            parse_mode: 'Markdown',
          }),
        })

        const sendData = (await sendRes.json()) as { ok: boolean; description?: string }
        if (!sendData.ok) {
          return res.status(400).json({
            success: false,
            error: sendData.description || 'Failed to send test message to Telegram Chat.',
          })
        }

        res.json({
          success: true,
          message: 'Telegram test message delivered successfully!',
          bot: {
            username: meData.result?.username,
            name: meData.result?.first_name,
          },
        })
      } catch (err) {
        console.error('[backup] telegram test failed:', err instanceof Error ? err.message : err)
        res.status(500).json({
          success: false,
          error: err instanceof Error ? err.message : 'Internal server error',
        })
      }
    }
  )

  /**
   * Send database and local client snapshot to Telegram Bot.
   */
  router.post(
    '/telegram/send',
    requireAuth(prisma, jwtSecret),
    requireRole('super_admin', 'school_admin', 'hr_admin'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const botToken = (req.body?.botToken || process.env.TELEGRAM_BOT_TOKEN || '').trim()
        const chatId = (req.body?.chatId || process.env.TELEGRAM_CHAT_ID || '').trim()

        if (!botToken || !chatId) {
          return res.status(400).json({
            success: false,
            error: 'Telegram Bot Token and Chat ID are required.',
          })
        }

        const isSuper = req.userRole === 'super_admin'
        let targetSchoolId = req.schoolId
        if (isSuper && req.body?.schoolId) {
          targetSchoolId = req.body.schoolId
        }

        if (!isSuper && !targetSchoolId) {
          return res.status(403).json({ error: 'No tenant context' })
        }

        const school = targetSchoolId
          ? await prisma.school.findUnique({
              where: { id: targetSchoolId },
              select: { id: true, name: true, domain: true, email: true, phone: true, address: true, storageMode: true, createdAt: true },
            })
          : null

        const isLocalComputer = school?.storageMode === 'local_computer' || Boolean(req.body?.clientData)
        const schoolFilter = targetSchoolId ? { schoolId: targetSchoolId } : {}

        // If local_computer mode or clientData provided:
        // "local file should be store not webside sever data store"
        // Use client's local files/stores directly instead of website server tables!
        let teachers: any[] = []
        let students: any[] = []
        let departments: any[] = []
        let notices: any[] = []

        if (!isLocalComputer) {
          ;[teachers, students, departments, notices] = await Promise.all([
            prisma.teacher.findMany({ where: schoolFilter }),
            prisma.student.findMany({ where: schoolFilter }),
            prisma.department.findMany({ where: schoolFilter }),
            prisma.notice.findMany({ where: schoolFilter }),
          ])
        }

        const timestamp = new Date().toISOString()
        const safeTimestamp = timestamp.replace(/[:.]/g, '-')
        const schoolSlug = school?.domain || req.body?.schoolSlug || 'global'
        const filename = `edutech_backup_${schoolSlug}_${safeTimestamp}.zip`

        const clientData = req.body?.clientData || null
        const counts = clientData?.metadata?.counts || {
          teachers: teachers.length,
          students: students.length,
          departments: departments.length,
          notices: notices.length,
        }

        const backupPayload = {
          metadata: {
            app: 'EduTech SMS',
            version: '2.0.0',
            timestamp,
            mode: isLocalComputer ? 'local_computer' : 'cloud',
            school: school || { domain: schoolSlug, name: req.body?.schoolName || 'EduTech School' },
            counts,
          },
          // When in local_computer mode, strictly store local file data, not website server database rows
          serverData: isLocalComputer ? null : {
            school,
            teachers,
            students,
            departments,
            notices,
          },
          clientData,
          stores: clientData?.stores || null,
        }

        const jsonString = JSON.stringify(backupPayload, null, 2)

        // Package as a compressed .zip archive containing all individual files and images folder
        const zip = new JSZip()
        zip.file('backup.json', jsonString)

        // Write individual JSON files and images
        if (clientData?.stores) {
          for (const [storeKey, storeData] of Object.entries(clientData.stores as Record<string, any>)) {
            if (!storeData) continue
            let rawBase = storeKey
            if (rawBase.startsWith('edutech-')) rawBase = rawBase.slice('edutech-'.length)
            else if (rawBase.startsWith('edutech_')) rawBase = rawBase.slice('edutech_'.length)
            const baseName = rawBase.split('_')[0]

            const str = JSON.stringify(storeData, null, 2)
            if (!zip.file(`${baseName}.json`)) zip.file(`${baseName}.json`, str)

            if (baseName === 'admissions') {
              const studentsList = storeData?.state?.students || storeData?.students
              const studentsPayload = Array.isArray(studentsList) ? { students: studentsList } : storeData
              if (!zip.file('students.json')) zip.file('students.json', JSON.stringify(studentsPayload, null, 2))
            }

            if (baseName === 'classes') {
              const routines = storeData?.state?.routines || storeData?.routines
              if (Array.isArray(routines) && !zip.file('routines.json')) {
                zip.file('routines.json', JSON.stringify({ routines }, null, 2))
              }
              const depts = storeData?.state?.departments || storeData?.departments
              if (Array.isArray(depts) && !zip.file('departments.json')) {
                zip.file('departments.json', JSON.stringify({ departments: depts }, null, 2))
              }
              const subs = storeData?.state?.subjects || storeData?.subjects
              if (Array.isArray(subs) && !zip.file('subjects.json')) {
                zip.file('subjects.json', JSON.stringify({ subjects: subs }, null, 2))
              }
            }

            if (baseName === 'teachers') {
              const depts = storeData?.state?.departments || storeData?.departments
              if (Array.isArray(depts) && !zip.file('departments.json')) {
                zip.file('departments.json', JSON.stringify({ departments: depts }, null, 2))
              }
              const desigs = storeData?.state?.designations || storeData?.designations
              if (Array.isArray(desigs) && !zip.file('designations.json')) {
                zip.file('designations.json', JSON.stringify({ designations: desigs }, null, 2))
              }
              const subs = storeData?.state?.subjects || storeData?.subjects
              if (Array.isArray(subs) && !zip.file('subjects.json')) {
                zip.file('subjects.json', JSON.stringify({ subjects: subs }, null, 2))
              }
            }
          }

          // Extract images into images/ folder inside the zip
          const imagesFolder = zip.folder('images')
          const classStore = clientData.stores['edutech-classes']
          const inst = classStore?.state?.institution || classStore?.institution
          if (inst && imagesFolder) {
            if (typeof inst.logo === 'string' && inst.logo.startsWith('data:image/')) {
              const base64Data = inst.logo.split(',')[1]
              if (base64Data) imagesFolder.file('logo.png', base64Data, { base64: true })
            }
            if (typeof inst.banner === 'string' && inst.banner.startsWith('data:image/')) {
              const base64Data = inst.banner.split(',')[1]
              if (base64Data) imagesFolder.file('banner.jpg', base64Data, { base64: true })
            }
          }

          // Teachers photos and signatures
          const teacherStore = clientData.stores['edutech-teachers']
          const tchList = teacherStore?.state?.teachers || teacherStore?.teachers
          if (Array.isArray(tchList) && imagesFolder) {
            const tchFolder = imagesFolder.folder('teachers')
            tchList.forEach((t: any) => {
              if (typeof t?.photo === 'string' && t.photo.startsWith('data:image/')) {
                const b64 = t.photo.split(',')[1]
                if (b64 && tchFolder) {
                  tchFolder.file(`${t.id || 'photo'}_photo.png`, b64, { base64: true })
                  tchFolder.file(`${t.id || 'photo'}.png`, b64, { base64: true })
                }
              }
              if (typeof t?.signature === 'string' && t.signature.startsWith('data:image/')) {
                const b64 = t.signature.split(',')[1]
                if (b64 && tchFolder) {
                  tchFolder.file(`${t.id || 'sig'}_signature.png`, b64, { base64: true })
                }
              }
            })
          }

          // Students photos
          const studentStore = clientData.stores['edutech-admissions']
          const stdList = studentStore?.state?.students || studentStore?.students
          if (Array.isArray(stdList) && imagesFolder) {
            const stdFolder = imagesFolder.folder('students')
            stdList.forEach((s: any) => {
              if (typeof s?.photo === 'string' && s.photo.startsWith('data:image/')) {
                const b64 = s.photo.split(',')[1]
                if (b64 && stdFolder) {
                  stdFolder.file(`${s.id || 'photo'}_photo.png`, b64, { base64: true })
                  stdFolder.file(`${s.id || 'photo'}.png`, b64, { base64: true })
                }
              }
            })
          }
        } else if (!isLocalComputer) {
          zip.file('teachers.json', JSON.stringify(teachers, null, 2))
          zip.file('students.json', JSON.stringify(students, null, 2))
          zip.file('departments.json', JSON.stringify(departments, null, 2))
          zip.file('notices.json', JSON.stringify(notices, null, 2))
        }

        const zipBuffer = await zip.generateAsync({
          type: 'nodebuffer',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 },
        })

        const sha256 = crypto.createHash('sha256').update(zipBuffer).digest('hex')
        const sizeKb = (zipBuffer.byteLength / 1024).toFixed(2)

        // Build FormData with Blob
        const formData = new FormData()
        formData.append('chat_id', chatId)
        formData.append('parse_mode', 'Markdown')

        const modeLabel = isLocalComputer ? 'Local Computer Storage (Local Files)' : 'Cloud Database'
        const caption =
          `📦 *EduTech SMS — Backup (ZIP Archive)*\n` +
          `🏫 Institution: *${school?.name || req.body?.schoolName || schoolSlug}*\n` +
          `📅 Date: \`${timestamp}\`\n` +
          `📊 Mode: \`${modeLabel}\`\n` +
          `📁 Archive: \`${filename}\` (${sizeKb} KB)\n` +
          `👥 Students: \`${counts.students || 0}\` | Teachers: \`${counts.teachers || 0}\`\n` +
          `🔒 SHA256: \`${sha256.slice(0, 16)}...\`\n` +
          `✅ Status: Verified & Complete`

        formData.append('caption', caption)

        const fileBlob = new Blob([zipBuffer], { type: 'application/zip' })
        formData.append('document', fileBlob, filename)

        const telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/sendDocument`, {
          method: 'POST',
          body: formData,
        })

        const telegramData = (await telegramRes.json()) as { ok: boolean; description?: string }

        if (!telegramData.ok) {
          return res.status(400).json({
            success: false,
            error: telegramData.description || 'Telegram document upload failed.',
          })
        }

        res.json({
          success: true,
          message: 'Backup file sent to Telegram successfully!',
          filename,
          size: `${sizeKb} KB`,
          sha256,
          timestamp,
        })
      } catch (err) {
        console.error('[backup] telegram send failed:', err instanceof Error ? err.message : err)
        res.status(500).json({
          success: false,
          error: err instanceof Error ? err.message : 'Internal server error',
        })
      }
    }
  )

  /**
   * Export server data as downloadable JSON for local computer storage fetcher.
   */
  router.get(
    '/export',
    requireAuth(prisma, jwtSecret),
    requireRole('super_admin', 'school_admin', 'hr_admin'),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const isSuper = req.userRole === 'super_admin'
        const targetSchoolId = isSuper && typeof req.query.schoolId === 'string' ? req.query.schoolId : req.schoolId

        if (!isSuper && !targetSchoolId) {
          return res.status(403).json({ error: 'No tenant context' })
        }

        const schoolFilter = targetSchoolId ? { schoolId: targetSchoolId } : {}

        const [school, teachers, students, departments, notices] = await Promise.all([
          targetSchoolId
            ? prisma.school.findUnique({
                where: { id: targetSchoolId },
                select: { id: true, name: true, domain: true, email: true, phone: true, address: true, createdAt: true },
              })
            : null,
          prisma.teacher.findMany({ where: schoolFilter }),
          prisma.student.findMany({ where: schoolFilter }),
          prisma.department.findMany({ where: schoolFilter }),
          prisma.notice.findMany({ where: schoolFilter }),
        ])

        const timestamp = new Date().toISOString()
        const schoolSlug = school?.domain || 'edutech'
        const filename = `edutech_server_export_${schoolSlug}_${timestamp.replace(/[:.]/g, '-')}.json`

        const exportData = {
          metadata: {
            app: 'EduTech SMS',
            version: '2.0.0',
            exportedAt: timestamp,
            school,
          },
          data: {
            teachers,
            students,
            departments,
            notices,
          },
        }

        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
        res.send(JSON.stringify(exportData, null, 2))
      } catch (err) {
        console.error('[backup] export failed:', err instanceof Error ? err.message : err)
        res.status(500).json({ error: 'Internal server error' })
      }
    }
  )

  return router
}
