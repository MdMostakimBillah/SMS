import { type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthenticatedRequest extends Request {
  userId?: string
  userRole?: string
  schoolId?: string | null
}

export function requireAuth(jwtSecret: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' })
    }
    try {
      const token = authHeader.split(' ')[1]
      const payload = jwt.verify(token, jwtSecret) as { userId: string; role: string; schoolId?: string | null }
      req.userId = payload.userId
      req.userRole = payload.role
      req.schoolId = payload.schoolId ?? null
      next()
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' })
    }
  }
}
