import type { Request } from 'express'
import type { PrismaClient, Prisma } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { SESSION_COOKIE, type AuthenticatedRequest, type SessionClaims } from '../middleware/auth.js'

/**
 * Shared institution lookup helper.
 * Unifies resolution by query params (schoolId / slug / domain), authenticated request context,
 * or session token. Avoids redundant duplicate database queries across route handlers.
 */
export async function resolveTargetSchool<T extends Prisma.SchoolSelect | undefined = undefined>(
  prisma: PrismaClient,
  req: Request,
  jwtSecret: string,
  select?: T
) {
  const authReq = req as AuthenticatedRequest
  const querySchoolId = (req.query.schoolId as string | undefined)?.trim()
  const querySlug = ((req.query.slug || req.query.domain) as string | undefined)?.trim()

  const targetIdentifier = querySchoolId || querySlug

  if (targetIdentifier) {
    const school = await prisma.school.findFirst({
      where: { OR: [{ id: targetIdentifier }, { domain: targetIdentifier }] },
      ...(select ? { select } : {}),
    })
    if (school) return school
  }

  if (authReq.schoolId) {
    return prisma.school.findUnique({
      where: { id: authReq.schoolId },
      ...(select ? { select } : {}),
    })
  }

  const token = req.cookies?.[SESSION_COOKIE] as string | undefined
  if (token) {
    try {
      const claims = jwt.verify(token, jwtSecret) as SessionClaims
      if (claims?.jti && claims?.userId) {
        const session = await prisma.session.findUnique({
          where: { id: claims.jti },
          include: {
            user: { select: { id: true, role: true, schoolId: true, isActive: true } },
          },
        })
        if (
          session &&
          session.userId === claims.userId &&
          !session.revokedAt &&
          session.expiresAt.getTime() > Date.now() &&
          session.user?.isActive &&
          session.user.schoolId
        ) {
          return prisma.school.findUnique({
            where: { id: session.user.schoolId },
            ...(select ? { select } : {}),
          })
        }
      }
    } catch {
      /* ignore */
    }
  }

  return null
}
