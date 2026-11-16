import { Router, Request, Response } from 'express'
import type { PrismaClient } from '@prisma/client'
import { requireAuth, type AuthenticatedRequest } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { resolveTargetSchool } from '../lib/resolveSchool.js'

export function attendanceRouter(prisma: PrismaClient, jwtSecret: string) {
  const router = Router()

  /**
   * GET /api/attendance
   * Fetch attendance and device configuration for the active institution.
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const school = await resolveTargetSchool(prisma, req, jwtSecret, {
        id: true,
        storageMode: true,
        attendanceData: true,
        devicesData: true,
      })
      if (!school) {
        return res.status(404).json({ error: 'Institution not found' })
      }

      const authReq = req as AuthenticatedRequest
      if (authReq.schoolId && authReq.userRole && authReq.userRole !== 'super_admin' && authReq.schoolId !== school.id) {
        return res.status(403).json({ error: 'Forbidden: cross-tenant access denied' })
      }

      if (school.storageMode === 'local_computer') {
        return res.json({
          storageMode: 'local_computer',
          attendance: {},
          devices: [],
          rfidEntries: [],
          fpEntries: [],
          faceEntries: [],
          mobileDevices: [],
          deviceLogs: [],
        })
      }

      let parsedAttendance: any = {}
      let parsedDevices: any = {}

      try {
        if ((school as any).attendanceData) {
          parsedAttendance = typeof (school as any).attendanceData === 'string'
            ? JSON.parse((school as any).attendanceData)
            : (school as any).attendanceData
        }
      } catch {
        parsedAttendance = {}
      }

      try {
        if ((school as any).devicesData) {
          parsedDevices = typeof (school as any).devicesData === 'string'
            ? JSON.parse((school as any).devicesData)
            : (school as any).devicesData
        }
      } catch {
        parsedDevices = {}
      }

      res.json({
        attendance: parsedAttendance && typeof parsedAttendance === 'object' ? parsedAttendance : {},
        devices: Array.isArray(parsedDevices?.devices) ? parsedDevices.devices : [],
        rfidEntries: Array.isArray(parsedDevices?.rfidEntries) ? parsedDevices.rfidEntries : [],
        fpEntries: Array.isArray(parsedDevices?.fpEntries) ? parsedDevices.fpEntries : [],
        faceEntries: Array.isArray(parsedDevices?.faceEntries) ? parsedDevices.faceEntries : [],
        mobileDevices: Array.isArray(parsedDevices?.mobileDevices) ? parsedDevices.mobileDevices : [],
        deviceLogs: Array.isArray(parsedDevices?.deviceLogs) ? parsedDevices.deviceLogs : [],
      })
    } catch (err) {
      console.error('[attendance] GET failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /**
   * PUT /api/attendance
   * Save attendance records for the institution.
   */
  router.put('/', requireAuth(prisma, jwtSecret), requireRole('school_admin', 'super_admin', 'teacher', 'hr_admin'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      let targetSchoolId = req.schoolId
      if (req.userRole === 'super_admin') {
        targetSchoolId = (req.query.schoolId as string) || req.body.schoolId || (req.query.slug as string) || req.schoolId
      } else {
        const requestedTarget = (req.query.schoolId as string) || req.body.schoolId || (req.query.slug as string)
        if (requestedTarget) {
          targetSchoolId = requestedTarget
        }
      }

      if (!targetSchoolId) {
        return res.status(400).json({ error: 'School ID required' })
      }

      const school = await prisma.school.findFirst({
        where: {
          OR: [{ id: targetSchoolId }, { domain: targetSchoolId }],
        },
        select: {
          id: true,
          storageMode: true,
          attendanceData: true,
        },
      })

      if (!school) {
        return res.status(404).json({ error: 'Institution not found' })
      }

      if (req.userRole !== 'super_admin' && req.schoolId !== school.id) {
        return res.status(403).json({ error: 'Forbidden' })
      }

      if (school.storageMode === 'local_computer') {
        return res.json({
          success: true,
          message: 'Local computer storage: Attendance stored locally on PC.',
          attendance: {},
        })
      }

      const incomingAttendance = req.body.attendance && typeof req.body.attendance === 'object'
        ? req.body.attendance
        : {}

      await prisma.school.update({
        where: { id: school.id },
        data: {
          attendanceData: JSON.stringify(incomingAttendance),
        } as any,
      })

      res.json({
        success: true,
        attendance: incomingAttendance,
      })
    } catch (err) {
      console.error('[attendance] PUT failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /**
   * PUT /api/attendance/devices
   * Save hardware devices, RFID cards, fingerprint, face, and mobile device configs.
   */
  router.put('/devices', requireAuth(prisma, jwtSecret), requireRole('school_admin', 'super_admin'), async (req: AuthenticatedRequest, res: Response) => {
    try {
      let targetSchoolId = req.schoolId
      if (req.userRole === 'super_admin') {
        targetSchoolId = (req.query.schoolId as string) || req.body.schoolId || (req.query.slug as string) || req.schoolId
      } else {
        const requestedTarget = (req.query.schoolId as string) || req.body.schoolId || (req.query.slug as string)
        if (requestedTarget) {
          targetSchoolId = requestedTarget
        }
      }

      if (!targetSchoolId) {
        return res.status(400).json({ error: 'School ID required' })
      }

      const school = await prisma.school.findFirst({
        where: {
          OR: [{ id: targetSchoolId }, { domain: targetSchoolId }],
        },
        select: {
          id: true,
          storageMode: true,
          devicesData: true,
        },
      })

      if (!school) {
        return res.status(404).json({ error: 'Institution not found' })
      }

      if (req.userRole !== 'super_admin' && req.schoolId !== school.id) {
        return res.status(403).json({ error: 'Forbidden' })
      }

      if (school.storageMode === 'local_computer') {
        return res.json({
          success: true,
          message: 'Local computer storage: Device configs stored locally on PC.',
        })
      }

      let existingDevices: any = {}
      try {
        if ((school as any).devicesData) {
          existingDevices = typeof (school as any).devicesData === 'string'
            ? JSON.parse((school as any).devicesData)
            : (school as any).devicesData
        }
      } catch {
        existingDevices = {}
      }

      const sanitizeArray = (val: any) => (Array.isArray(val) ? val.slice(0, 5000) : undefined)

      const updatedDevices = {
        devices: req.body.devices !== undefined ? (sanitizeArray(req.body.devices) ?? existingDevices.devices ?? []) : (existingDevices.devices || []),
        rfidEntries: req.body.rfidEntries !== undefined ? (sanitizeArray(req.body.rfidEntries) ?? existingDevices.rfidEntries ?? []) : (existingDevices.rfidEntries || []),
        fpEntries: req.body.fpEntries !== undefined ? (sanitizeArray(req.body.fpEntries) ?? existingDevices.fpEntries ?? []) : (existingDevices.fpEntries || []),
        faceEntries: req.body.faceEntries !== undefined ? (sanitizeArray(req.body.faceEntries) ?? existingDevices.faceEntries ?? []) : (existingDevices.faceEntries || []),
        mobileDevices: req.body.mobileDevices !== undefined ? (sanitizeArray(req.body.mobileDevices) ?? existingDevices.mobileDevices ?? []) : (existingDevices.mobileDevices || []),
        deviceLogs: req.body.deviceLogs !== undefined ? (sanitizeArray(req.body.deviceLogs) ?? existingDevices.deviceLogs ?? []) : (existingDevices.deviceLogs || []),
      }

      await prisma.school.update({
        where: { id: school.id },
        data: {
          devicesData: JSON.stringify(updatedDevices),
        } as any,
      })

      res.json({
        success: true,
        ...updatedDevices,
      })
    } catch (err) {
      console.error('[attendance/devices] PUT failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /**
   * POST /api/attendance/punch
   * Record a punch from punch device, RFID scanner, fingerprint scanner, face recognition, or mobile app.
   */
  router.post('/punch', requireAuth(prisma, jwtSecret), async (req: AuthenticatedRequest, res: Response) => {
    try {
      const targetSchoolId = req.schoolId
      if (!targetSchoolId) {
        return res.status(400).json({ error: 'School ID required' })
      }

      const school = await prisma.school.findUnique({
        where: { id: targetSchoolId },
        select: {
          id: true,
          storageMode: true,
          attendanceData: true,
          devicesData: true,
        },
      })

      if (!school) {
        return res.status(404).json({ error: 'Institution not found' })
      }

      const { rfidCard, fpId, faceId, method = 'punch', deviceId = 'API' } = req.body
      let { personId, type, time, date } = req.body

      const now = new Date()
      if (!date) {
        date = now.toISOString().split('T')[0]
      }
      if (!time) {
        time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      }

      let parsedDevices: any = {}
      try {
        if ((school as any).devicesData) {
          parsedDevices = typeof (school as any).devicesData === 'string'
            ? JSON.parse((school as any).devicesData)
            : (school as any).devicesData
        }
      } catch {
        parsedDevices = {}
      }

      // Resolve personId if card / biometric id provided
      if (!personId) {
        if (rfidCard && Array.isArray(parsedDevices.rfidEntries)) {
          const match = parsedDevices.rfidEntries.find((r: any) => r.rfidCard === rfidCard)
          if (match) personId = match.staffId
        } else if (fpId !== undefined && Array.isArray(parsedDevices.fpEntries)) {
          const match = parsedDevices.fpEntries.find((f: any) => Number(f.fpId) === Number(fpId))
          if (match) personId = match.staffId
        } else if (faceId !== undefined && Array.isArray(parsedDevices.faceEntries)) {
          const match = parsedDevices.faceEntries.find((f: any) => Number(f.faceId) === Number(faceId))
          if (match) personId = match.staffId
        }
      }

      if (!personId) {
        return res.status(404).json({ error: 'Person could not be identified from punch credentials' })
      }

      let parsedAttendance: any = {}
      try {
        if ((school as any).attendanceData) {
          parsedAttendance = typeof (school as any).attendanceData === 'string'
            ? JSON.parse((school as any).attendanceData)
            : (school as any).attendanceData
        }
      } catch {
        parsedAttendance = {}
      }

      const dayAtt = parsedAttendance[date] || {}
      const existingPersonAtt = dayAtt[personId] || { status: 'present', punches: [] }
      const punches = existingPersonAtt.punches || []

      // If type not specified, alternate in / out
      if (!type) {
        const lastPunch = punches[punches.length - 1]
        type = !lastPunch || lastPunch.type === 'out' ? 'in' : 'out'
      }

      const updatedPunches = [...punches, { time, type, method, deviceId }]
      const updatedAttendance = {
        ...parsedAttendance,
        [date]: {
          ...dayAtt,
          [personId]: {
            status: 'present',
            punches: updatedPunches,
          },
        },
      }

      const newLog = {
        id: `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: now.toISOString(),
        date,
        time,
        personId,
        type,
        method,
        deviceId,
      }

      const existingLogs = Array.isArray(parsedDevices.deviceLogs) ? parsedDevices.deviceLogs : []
      const updatedLogs = [newLog, ...existingLogs].slice(0, 500)

      const updatedDevicesState = {
        ...parsedDevices,
        deviceLogs: updatedLogs,
      }

      if (school.storageMode !== 'local_computer') {
        await prisma.school.update({
          where: { id: school.id },
          data: {
            attendanceData: JSON.stringify(updatedAttendance),
            devicesData: JSON.stringify(updatedDevicesState),
          } as any,
        })
      }

      res.json({
        success: true,
        personId,
        date,
        time,
        type,
        method,
        deviceId,
        punches: updatedPunches,
      })
    } catch (err) {
      console.error('[attendance/punch] POST failed:', err instanceof Error ? err.message : err)
      res.status(500).json({ error: 'Internal server error' })
    }
  })

  /**
   * POST /api/attendance/push
   * Cloud push receiver for biometric punch machines (ADMS, Hikvision ISAPI, Webhook, ZKTeco).
   * Supports both direct webhook JSON and ADMS table=ATTLOG text formats.
   */
  router.all('/push', async (req: Request, res: Response) => {
    try {
      const serialNo = (req.query.SN as string) || (req.body?.serialNo as string) || (req.body?.deviceId as string) || 'ADMS-DEVICE'
      const schoolToken = (req.query.token as string) || (req.headers['x-device-token'] as string) || (req.body?.token as string)
      const requestedSchoolId = (req.query.schoolId as string) || (req.query.slug as string) || (req.body?.schoolId as string)

      let school = null
      if (requestedSchoolId) {
        school = await prisma.school.findFirst({
          where: { OR: [{ id: requestedSchoolId }, { domain: requestedSchoolId }] },
          select: { id: true, storageMode: true, attendanceData: true, devicesData: true },
        })
      }
      if (!school && schoolToken) {
        const schools = await prisma.school.findMany({
          select: { id: true, storageMode: true, attendanceData: true, devicesData: true },
          take: 20,
        })
        school = schools.find((s) => typeof s.devicesData === 'string' && s.devicesData.includes(schoolToken)) || null
      }
      if (!school) {
        school = await prisma.school.findFirst({
          select: { id: true, storageMode: true, attendanceData: true, devicesData: true },
        })
      }

      if (!school) {
        return res.status(404).send('Institution not found')
      }

      let parsedDevices: any = {}
      try {
        if ((school as any).devicesData) {
          parsedDevices = typeof (school as any).devicesData === 'string'
            ? JSON.parse((school as any).devicesData)
            : (school as any).devicesData
        }
      } catch {
        parsedDevices = {}
      }

      let parsedAttendance: any = {}
      try {
        if ((school as any).attendanceData) {
          parsedAttendance = typeof (school as any).attendanceData === 'string'
            ? JSON.parse((school as any).attendanceData)
            : (school as any).attendanceData
        }
      } catch {
        parsedAttendance = {}
      }

      const rawRecords: Array<{ pin: string; time?: string; date?: string; type?: 'in' | 'out'; method?: string }> = []

      if (Array.isArray(req.body?.punches)) {
        for (const p of req.body.punches) {
          rawRecords.push({
            pin: String(p.pin || p.userId || p.personId || p.cardNo || ''),
            time: p.time,
            date: p.date,
            type: p.type,
            method: p.method || 'punch',
          })
        }
      } else if (req.body?.pin || req.body?.userId || req.body?.personId) {
        rawRecords.push({
          pin: String(req.body.pin || req.body.userId || req.body.personId || ''),
          time: req.body.time,
          date: req.body.date,
          type: req.body.type,
          method: req.body.method || 'punch',
        })
      } else if (typeof req.body === 'string' && req.body.includes('\t')) {
        const lines = req.body.split(/\r?\n/)
        for (const line of lines) {
          const parts = line.split('\t')
          if (parts.length >= 2) {
            const pin = parts[0].trim()
            const dt = parts[1].trim()
            const [d, t] = dt.includes(' ') ? dt.split(' ') : [undefined, dt]
            rawRecords.push({ pin, date: d, time: t ? t.slice(0, 5) : undefined, method: 'punch' })
          }
        }
      }

      const now = new Date()
      const today = now.toISOString().split('T')[0]
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

      let recordedCount = 0
      const newLogs: any[] = []

      for (const rec of rawRecords) {
        if (!rec.pin) continue
        let targetPersonId = ''
        const allDevices = Array.isArray(parsedDevices.devices) ? parsedDevices.devices : []
        for (const d of allDevices) {
          const enrolled = Array.isArray(d.enrolledUsers) ? d.enrolledUsers : []
          const found = enrolled.find((m: any) => String(m.devicePin) === rec.pin || String(m.cardNo) === rec.pin || m.personId === rec.pin)
          if (found) {
            targetPersonId = found.personId
            break
          }
        }

        if (!targetPersonId && Array.isArray(parsedDevices.rfidEntries)) {
          const rfidMatch = parsedDevices.rfidEntries.find((r: any) => r.rfidCard === rec.pin || r.staffId === rec.pin)
          if (rfidMatch) targetPersonId = rfidMatch.staffId
        }

        if (!targetPersonId) {
          targetPersonId = rec.pin
        }

        const date = rec.date || today
        const time = rec.time || currentTime
        const dayAtt = parsedAttendance[date] || {}
        const existingPersonAtt = dayAtt[targetPersonId] || { status: 'present', punches: [] }
        const punches = existingPersonAtt.punches || []

        let punchType = rec.type
        if (!punchType) {
          const lastPunch = punches[punches.length - 1]
          punchType = !lastPunch || lastPunch.type === 'out' ? 'in' : 'out'
        }

        const newPunch = { time, type: punchType, method: rec.method || 'punch', deviceId: serialNo }
        dayAtt[targetPersonId] = {
          status: 'present',
          punches: [...punches, newPunch],
          note: existingPersonAtt.note,
        }
        parsedAttendance[date] = dayAtt

        newLogs.push({
          id: `LOG-PUSH-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp: now.toISOString(),
          date,
          time,
          personId: targetPersonId,
          type: punchType,
          method: rec.method || 'punch',
          deviceId: serialNo,
        })
        recordedCount++
      }

      if (recordedCount > 0 && school.storageMode !== 'local_computer') {
        const existingLogs = Array.isArray(parsedDevices.deviceLogs) ? parsedDevices.deviceLogs : []
        parsedDevices.deviceLogs = [...newLogs, ...existingLogs].slice(0, 500)

        await prisma.school.update({
          where: { id: school.id },
          data: {
            attendanceData: JSON.stringify(parsedAttendance),
            devicesData: JSON.stringify(parsedDevices),
          } as any,
        })
      }

      if (req.query.table === 'ATTLOG' || req.query.SN) {
        return res.send(`OK: ${recordedCount}`)
      }

      res.json({
        success: true,
        recorded: recordedCount,
        deviceId: serialNo,
        timestamp: now.toISOString(),
      })
    } catch (err) {
      console.error('[attendance/push] Error:', err instanceof Error ? err.message : err)
      res.status(500).send('ERROR')
    }
  })

  return router
}
