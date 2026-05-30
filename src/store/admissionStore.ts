import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { StudentAdmission } from '@/pages/students/admission/types'

// Sample data for testing
const sampleStudents: StudentAdmission[] = [
  {
    id: 'ET-2026-10001', createdAt: '2026-05-01', updatedAt: '2026-05-01',
    status: 'pending', photo: '',
    nameEn: 'Rahul Kumar', nameBn: 'রাহুল কুমার', dob: '2012-03-15',
    gender: 'Male', bloodGroup: 'A+', religion: 'Hinduism / হিন্দু',
    nationality: 'Bangladeshi', phone: '01711-111111', email: 'rahul@mail.com',
    class: '9', section: 'A', roll: '01', academicYear: '2025-26',
    previousSchool: 'Dhaka Model School', admissionDate: '2026-05-01',
    presentAddress: 'Mirpur-10, Dhaka', permanentAddress: 'Mirpur-10, Dhaka', district: 'Dhaka',
    fatherNameEn: 'Suresh Kumar', fatherNameBn: 'সুরেশ কুমার', fatherOccupation: 'Business',
    fatherPhone: '01711-222222', fatherNid: '1234567890',
    motherNameEn: 'Anita Kumar', motherNameBn: 'অনিতা কুমার', motherOccupation: 'Housewife',
    motherPhone: '01711-333333', motherNid: '0987654321',
    guardianName: '', guardianRelation: '', guardianPhone: '',
  },
  {
    id: 'ET-2026-10002', createdAt: '2026-05-02', updatedAt: '2026-05-02',
    status: 'approved', approvedAt: '2026-05-03', photo: '',
    nameEn: 'Nisha Das', nameBn: 'নিশা দাস', dob: '2013-08-05',
    gender: 'Female', bloodGroup: 'B+', religion: 'Hinduism / হিন্দু',
    nationality: 'Bangladeshi', phone: '01722-111111', email: 'nisha@mail.com',
    class: '8', section: 'B', roll: '02', academicYear: '2025-26',
    previousSchool: 'Viqarunnisa Noon School', admissionDate: '2026-05-02',
    presentAddress: 'Dhanmondi, Dhaka', permanentAddress: 'Barisal', district: 'Dhaka',
    fatherNameEn: 'Rajan Das', fatherNameBn: 'রাজন দাস', fatherOccupation: 'Teacher',
    fatherPhone: '01722-222222', fatherNid: '2345678901',
    motherNameEn: 'Priya Das', motherNameBn: 'প্রিয়া দাস', motherOccupation: 'Doctor',
    motherPhone: '01722-333333', motherNid: '1098765432',
    guardianName: '', guardianRelation: '', guardianPhone: '',
  },
  {
    id: 'ET-2026-10003', createdAt: '2026-05-03', updatedAt: '2026-05-03',
    status: 'pending', photo: '',
    nameEn: 'Tariq Islam', nameBn: 'তারিক ইসলাম', dob: '2010-01-20',
    gender: 'Male', bloodGroup: 'O+', religion: 'Islam / ইসলাম',
    nationality: 'Bangladeshi', phone: '01733-111111', email: 'tariq@mail.com',
    class: '10', section: 'A', roll: '03', academicYear: '2025-26',
    previousSchool: 'Rajuk Uttara Model College', admissionDate: '2026-05-03',
    presentAddress: 'Uttara, Dhaka', permanentAddress: 'Sylhet', district: 'Dhaka',
    fatherNameEn: 'Abdul Islam', fatherNameBn: 'আব্দুল ইসলাম', fatherOccupation: 'Engineer',
    fatherPhone: '01733-222222', fatherNid: '3456789012',
    motherNameEn: 'Fatema Islam', motherNameBn: 'ফাতেমা ইসলাম', motherOccupation: 'Housewife',
    motherPhone: '01733-333333', motherNid: '2109876543',
    guardianName: '', guardianRelation: '', guardianPhone: '',
  },
  {
    id: 'ET-2026-10004', createdAt: '2026-05-04', updatedAt: '2026-05-04',
    status: 'approved', approvedAt: '2026-05-05', photo: '',
    nameEn: 'Anika Roy', nameBn: 'আনিকা রায়', dob: '2014-11-08',
    gender: 'Female', bloodGroup: 'AB+', religion: 'Hinduism / হিন্দু',
    nationality: 'Bangladeshi', phone: '01744-111111', email: 'anika@mail.com',
    class: '7', section: 'C', roll: '04', academicYear: '2025-26',
    previousSchool: 'Holy Cross Girls School', admissionDate: '2026-05-04',
    presentAddress: 'Mohammadpur, Dhaka', permanentAddress: 'Khulna', district: 'Dhaka',
    fatherNameEn: 'Bikash Roy', fatherNameBn: 'বিকাশ রায়', fatherOccupation: 'Accountant',
    fatherPhone: '01744-222222', fatherNid: '4567890123',
    motherNameEn: 'Suma Roy', motherNameBn: 'সুমা রায়', motherOccupation: 'Teacher',
    motherPhone: '01744-333333', motherNid: '3210987654',
    guardianName: '', guardianRelation: '', guardianPhone: '',
  },
  {
    id: 'ET-2026-10005', createdAt: '2026-05-05', updatedAt: '2026-05-05',
    status: 'pending', photo: '',
    nameEn: 'Mohammad Karim', nameBn: 'মোহাম্মদ করিম', dob: '2011-06-12',
    gender: 'Male', bloodGroup: 'B-', religion: 'Islam / ইসলাম',
    nationality: 'Bangladeshi', phone: '01755-111111', email: 'karim@mail.com',
    class: '8', section: 'A', roll: '05', academicYear: '2025-26',
    previousSchool: 'Ideal School', admissionDate: '2026-05-05',
    presentAddress: 'Gulshan, Dhaka', permanentAddress: 'Comilla', district: 'Dhaka',
    fatherNameEn: 'Rahim Karim', fatherNameBn: 'রহিম করিম', fatherOccupation: 'Business',
    fatherPhone: '01755-222222', fatherNid: '5678901234',
    motherNameEn: 'Roksana Karim', motherNameBn: 'রোকসানা করিম', motherOccupation: 'Housewife',
    motherPhone: '01755-333333', motherNid: '4321098765',
    guardianName: '', guardianRelation: '', guardianPhone: '',
  },
  {
    id: 'ET-2026-10006', createdAt: '2026-05-06', updatedAt: '2026-05-06',
    status: 'rejected', photo: '',
    nameEn: 'Sadia Akter', nameBn: 'সাদিয়া আক্তার', dob: '2012-09-25',
    gender: 'Female', bloodGroup: 'A-', religion: 'Islam / ইসলাম',
    nationality: 'Bangladeshi', phone: '01766-111111', email: 'sadia@mail.com',
    class: '9', section: 'B', roll: '06', academicYear: '2025-26',
    previousSchool: 'BRAC School', admissionDate: '2026-05-06',
    presentAddress: 'Banani, Dhaka', permanentAddress: 'Rajshahi', district: 'Dhaka',
    fatherNameEn: 'Jalal Akter', fatherNameBn: 'জালাল আক্তার', fatherOccupation: 'Service',
    fatherPhone: '01766-222222', fatherNid: '6789012345',
    motherNameEn: 'Nasrin Akter', motherNameBn: 'নাসরিন আক্তার', motherOccupation: 'Service',
    motherPhone: '01766-333333', motherNid: '5432109876',
    guardianName: '', guardianRelation: '', guardianPhone: '',
  },
]

interface AdmissionState {
  students: StudentAdmission[]
  addStudent: (student: StudentAdmission) => void
  updateStudent: (id: string, data: Partial<StudentAdmission>) => void
  approveStudent: (id: string) => void
  rejectStudent: (id: string) => void
  getNextId: () => string
}

export const useAdmissionStore = create<AdmissionState>()(
  persist(
    (set, get) => ({
      students: sampleStudents,

      addStudent: (student) =>
        set(state => ({ students: [student, ...state.students] })),

      updateStudent: (id, data) =>
        set(state => ({
          students: state.students.map(s =>
            s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString().split('T')[0] } : s
          ),
        })),

      approveStudent: (id) =>
        set(state => ({
          students: state.students.map(s =>
            s.id === id
              ? { ...s, status: 'approved', approvedAt: new Date().toISOString().split('T')[0], updatedAt: new Date().toISOString().split('T')[0] }
              : s
          ),
        })),

      rejectStudent: (id) =>
        set(state => ({
          students: state.students.map(s =>
            s.id === id
              ? { ...s, status: 'rejected', updatedAt: new Date().toISOString().split('T')[0] }
              : s
          ),
        })),

      getNextId: () => {
        const year = new Date().getFullYear()
        const count = get().students.length + 1
        const num = String(10000 + count).padStart(5, '0')
        return `ET-${year}-${num}`
      },
    }),
    { name: 'edutech-admissions' }
  )
)
