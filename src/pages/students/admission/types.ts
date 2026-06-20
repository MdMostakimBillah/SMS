export type AdmissionStatus = 'pending' | 'approved' | 'rejected'

export interface StudentAdmission {
  id: string
  createdAt: string
  updatedAt: string
  status: AdmissionStatus
  active?: boolean
  approvedAt?: string
  inactiveAt?: string
  inactiveReason?: string
  photo: string
  nameEn: string
  nameBn: string
  dob: string
  gender: string
  bloodGroup: string
  religion: string
  nationality: string
  phone: string
  email: string
  class: string
  section: string
  roll: string
  academicYear: string
  previousSchool: string
  admissionDate: string
  presentAddress: string
  permanentAddress: string
  district: string
  fatherNameEn: string
  fatherNameBn: string
  fatherOccupation: string
  fatherPhone: string
  fatherNid: string
  motherNameEn: string
  motherNameBn: string
  motherOccupation: string
  motherPhone: string
  motherNid: string
  guardianName: string
  guardianRelation: string
  guardianPhone: string
  teacherId: string
  billingDate?: string
}
