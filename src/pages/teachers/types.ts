export type TeacherStatus = 'active' | 'inactive' | 'on-leave'

export interface Department {
  id: string
  name: string
  nameBn: string
  head: string
  createdAt: string
  updatedAt: string
}

export interface Designation {
  id: string
  name: string
  nameBn: string
  createdAt: string
  updatedAt: string
}

export interface Subject {
  id: string
  name: string
  nameBn: string
  departmentId: string
  departmentIds: string[]
  createdAt: string
  updatedAt: string
}

export interface Teacher {
  id: string
  createdAt: string
  updatedAt: string
  status: TeacherStatus
  photo: string
  nameEn: string
  nameBn: string
  gender: string
  dob: string
  bloodGroup: string
  religion: string
  phone: string
  email: string
  address: string
  nid: string
  emergencyPhone: string
  departmentId: string
  subjectIds: string[]
  designation: string
  qualification: string
  experience: string
  joiningDate: string
  salary: number
  salaryStartDate?: string
  bonus?: number
  overtime?: number
  festivalBonus?: number
  inTime: string
  outTime: string
  fatherNameEn: string
  fatherNameBn: string
  fatherPhone: string
  fatherNid: string
  motherNameEn: string
  motherNameBn: string
  motherPhone: string
  guardianName: string
  guardianPhone: string
  guardianRelation: string
  parentAddress: string
  signature?: string
  expertSubjects?: string
  applySalaryRule?: boolean
}
