import type { TeacherData, DepartmentData } from '@/lib/api'
import type { Teacher, TeacherStatus, Department } from '@/pages/teachers/types'

/**
 * Server <-> UI mappers for the Phase 7 teacher migration.
 *
 * Server rows are authoritative: nulls become display-safe empty strings,
 * Decimal columns (salary/bonus/...) arrive as numeric strings and are coerced
 * to numbers for the UI. Fields the server does not know (`createdBy`) are
 * deliberately not produced — the UI type keeps them optional for legacy data
 * that lives only in the local backup.
 */

const str = (v: string | null | undefined): string => v ?? ''

function toNumber(v: string | number | null | undefined): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

/** Server `status` is a free string; the UI type is a union — unknown values map to 'active'. */
function toStatus(status: string): TeacherStatus {
  return status === 'inactive' || status === 'on-leave' ? status : 'active'
}

export function serverTeacherToTeacher(t: TeacherData): Teacher {
  return {
    id: t.id,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    status: toStatus(t.status),
    category: str(t.category),
    photo: str(t.photo),
    nameEn: t.nameEn,
    nameBn: str(t.nameBn),
    gender: str(t.gender),
    dob: str(t.dob),
    bloodGroup: str(t.bloodGroup),
    religion: str(t.religion),
    phone: str(t.phone),
    email: str(t.email),
    address: str(t.address),
    nid: str(t.nid),
    emergencyPhone: str(t.emergencyPhone),
    departmentId: str(t.departmentId),
    subjectIds: t.subjectIds ?? [],
    designation: str(t.designation),
    qualification: str(t.qualification),
    experience: str(t.experience),
    joiningDate: str(t.joiningDate),
    salary: toNumber(t.salary),
    salaryStartDate: t.salaryStartDate ?? undefined,
    bonus: t.bonus != null ? toNumber(t.bonus) : undefined,
    overtime: toNumber(t.overtime),
    festivalBonus: t.festivalBonus != null ? toNumber(t.festivalBonus) : undefined,
    inTime: str(t.inTime),
    outTime: str(t.outTime),
    fatherNameEn: str(t.fatherNameEn),
    fatherNameBn: str(t.fatherNameBn),
    fatherPhone: str(t.fatherPhone),
    fatherNid: str(t.fatherNid),
    motherNameEn: str(t.motherNameEn),
    motherNameBn: str(t.motherNameBn),
    motherPhone: str(t.motherPhone),
    guardianName: str(t.guardianName),
    guardianPhone: str(t.guardianPhone),
    guardianRelation: str(t.guardianRelation),
    parentAddress: str(t.parentAddress),
    signature: t.signature ?? undefined,
    expertSubjects: t.expertSubjects ?? undefined,
    applySalaryRule: t.applySalaryRule ?? undefined,
  }
}

/**
 * UI teacher -> API payload.
 *
 * - Only editable columns are emitted; `schoolId`/`id`/`createdAt` are never
 *   sent (the server derives tenant from session and strips unknown fields).
 * - `undefined` means "field absent" so partial updates don't null untouched
 *   columns; empty strings become explicit `null` (clear the column).
 */
export function teacherToPayload(t: Partial<Teacher>): Partial<TeacherData> {
  const nullIfEmpty = (v: string | undefined): string | null | undefined =>
    v === undefined ? undefined : v === '' ? null : v.trim() || null

  return {
    nameEn: t.nameEn?.trim(),
    nameBn: nullIfEmpty(t.nameBn),
    gender: nullIfEmpty(t.gender),
    dob: nullIfEmpty(t.dob),
    bloodGroup: nullIfEmpty(t.bloodGroup),
    religion: nullIfEmpty(t.religion),
    phone: nullIfEmpty(t.phone),
    email: nullIfEmpty(t.email),
    address: nullIfEmpty(t.address),
    nid: nullIfEmpty(t.nid),
    emergencyPhone: nullIfEmpty(t.emergencyPhone),
    photo: t.photo === undefined ? undefined : t.photo === '' ? null : t.photo,
    departmentId: t.departmentId === undefined ? undefined : t.departmentId === '' ? null : t.departmentId,
    subjectIds: t.subjectIds,
    designation: nullIfEmpty(t.designation),
    qualification: nullIfEmpty(t.qualification),
    experience: nullIfEmpty(t.experience),
    salary: t.salary === undefined ? undefined : String(Number(t.salary) || 0),
    salaryStartDate: nullIfEmpty(t.salaryStartDate),
    bonus: t.bonus === undefined ? undefined : String(Number(t.bonus) || 0),
    overtime: t.overtime === undefined ? undefined : String(Number(t.overtime) || 0),
    festivalBonus: t.festivalBonus === undefined ? undefined : String(Number(t.festivalBonus) || 0),
    status: t.status,
    category: nullIfEmpty(t.category),
    joiningDate: nullIfEmpty(t.joiningDate),
    inTime: nullIfEmpty(t.inTime),
    outTime: nullIfEmpty(t.outTime),
    fatherNameEn: nullIfEmpty(t.fatherNameEn),
    fatherNameBn: nullIfEmpty(t.fatherNameBn),
    fatherPhone: nullIfEmpty(t.fatherPhone),
    fatherNid: nullIfEmpty(t.fatherNid),
    motherNameEn: nullIfEmpty(t.motherNameEn),
    motherNameBn: nullIfEmpty(t.motherNameBn),
    motherPhone: nullIfEmpty(t.motherPhone),
    guardianName: nullIfEmpty(t.guardianName),
    guardianPhone: nullIfEmpty(t.guardianPhone),
    guardianRelation: nullIfEmpty(t.guardianRelation),
    parentAddress: nullIfEmpty(t.parentAddress),
    signature: t.signature === undefined ? undefined : t.signature === '' ? null : t.signature,
    expertSubjects: nullIfEmpty(t.expertSubjects),
    applySalaryRule: t.applySalaryRule,
    // `createdBy` is a local-only legacy field — no server column; never sent.
  }
}

export function serverDepartmentToDepartment(d: DepartmentData): Department {
  return {
    id: d.id,
    name: d.name,
    nameBn: str(d.nameBn),
    head: str(d.head),
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }
}

/**
 * Human-readable API failure message for teacher/department flows.
 * 401/403/404/409/400 get distinct copy so the UI never silently falls back
 * to local data when the server refuses.
 */
export function apiErrorMessage(err: unknown, isBn: boolean): string {
  if (err && typeof err === 'object' && 'status' in err && 'message' in err) {
    const status = (err as { status: number }).status
    const serverMsg = String((err as { message: string }).message || '')
    if (status === 401) return isBn ? 'সেশনের মেয়াদ শেষ — আবার সাইন ইন করুন' : 'Session expired — please sign in again'
    if (status === 403) return isBn ? 'এই কাজের অনুমতি নেই' : 'You are not allowed to perform this action'
    if (status === 404) return isBn ? 'রেকর্ডটি পাওয়া যায়নি' : 'Record not found'
    if (status === 409) return serverMsg || (isBn ? 'একই তথ্যে রেকর্ড ইতিমধ্যে আছে' : 'A record with this information already exists')
    if (status === 400) return serverMsg || (isBn ? 'তথ্য সঠিক নয়' : 'Invalid data')
    if (serverMsg) return serverMsg
  }
  if (err instanceof TypeError || (err instanceof Error && err.message === 'fetch failed')) {
    return isBn ? 'সার্ভারে সংযোগ করা যায়নি' : 'Could not reach the server'
  }
  return isBn ? 'কাজটি সম্পন্ন হয়নি' : 'The action could not be completed'
}
