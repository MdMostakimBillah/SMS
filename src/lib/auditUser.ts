interface AuditUser {
  name?: string | null
  email?: string
  staffId?: string
  id?: string
}

export function getAuditUser(user: AuditUser | null): string {
  if (!user) return 'Unknown'
  const name = user.name || user.email || 'Unknown'
  return user.staffId ? `${name} (${user.staffId})` : name
}
