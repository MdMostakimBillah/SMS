import type { InstitutionSettings, ClassInfo, ThemeColors } from '@/store/classStore'
import { defaultThemeColors, defaultThemeColorsDark } from '@/store/classStore'
import type { Teacher, Department, Subject, Designation } from '@/pages/teachers/types'
import type { StudentAdmission } from '@/pages/students/admission/types'
import type { FeeCategory, FeeStructure, FeePayment } from '@/store/feeStore'

const T = (t: Partial<Teacher> & { id: string; nameEn: string; nameBn: string; designation: string; departmentId: string; subjectIds: string[]; salary: number; experience: string; joiningDate: string }): Teacher => ({
  createdAt: '2024-08-01', updatedAt: '2024-08-01', status: 'active', category: 'full-time', photo: '',
  gender: 'male', dob: '1990-01-01', bloodGroup: 'A+', religion: 'Islam', phone: '', email: '', address: '',
  nid: '', emergencyPhone: '', qualification: '', inTime: '08:00', outTime: '16:00',
  fatherNameEn: '', fatherNameBn: '', fatherPhone: '', fatherNid: '',
  motherNameEn: '', motherNameBn: '', motherPhone: '',
  guardianName: '', guardianPhone: '', guardianRelation: '', parentAddress: '',
  ...t,
})

const S = (s: Partial<StudentAdmission> & { id: string; nameEn: string; nameBn: string; class: string; section: string; roll: string; teacherId: string }): StudentAdmission => ({
  createdAt: '2025-01-10', updatedAt: '2025-01-10', status: 'approved', photo: '', dob: '2012-01-01',
  gender: 'male', bloodGroup: 'A+', religion: 'Islam', phone: '', email: '', academicYear: '2025-26',
  admissionDate: '2025-01-10', presentAddress: '', permanentAddress: '', district: 'Dhaka',
  nationality: 'Bangladeshi', previousSchool: '',
  fatherNameEn: '', fatherNameBn: '', fatherOccupation: '', fatherPhone: '', fatherNid: '',
  motherNameEn: '', motherNameBn: '', motherOccupation: '', motherPhone: '', motherNid: '',
  guardianName: '', guardianRelation: '', guardianPhone: '',
  ...s,
})

export interface InstitutionData {
  institution: InstitutionSettings
  classes: ClassInfo[]
  teachers: Teacher[]
  departments: Department[]
  subjects: Subject[]
  designations: Designation[]
  students: StudentAdmission[]
  feeCategories: FeeCategory[]
  feeStructures: FeeStructure[]
  feePayments: FeePayment[]
}

function makeColors(brand: string): ThemeColors {
  return { ...defaultThemeColors, brand }
}
function makeDarkColors(brand: string): ThemeColors {
  return { ...defaultThemeColorsDark, brand }
}

const sunriseData: InstitutionData = {
  institution: {
    name: 'Sunrise Academy',
    nameBn: 'সানরাইজ একাডেমি',
    logo: '',
    banner: '',
    bannerPosition: { x: 0, y: 0 },
    brandName: 'EduTech',
    motto: 'Knowledge is Power',
    mottoBn: 'জ্ঞাই হলো শক্তি',
    eiin: '123456',
    phone: '+880-1712-345678',
    email: 'admin@sunrise.edu.bd',
    address: 'Banani, Dhaka 1213',
    website: 'sunrise.smsappbd.vercel.app',
    subjects: ['Bangla', 'English', 'Mathematics', 'Science', 'ICT'],
    startTime: '07:30',
    endTime: '14:30',
    breaks: [{ id: 'BRK-1', label: 'Tiffin', start: '11:00', end: '11:30' }],
    currentSession: '2025-26',
    sessions: ['2024-25', '2025-26'],
    lightColors: makeColors('#6366f1'),
    darkColors: makeDarkColors('#6366f1'),
  },
  classes: [
    { id: 'CLS-1', name: 'Class 6', nameBn: 'ষষ্ঠ শ্রেণি', sections: [{ id: 'SEC-1A', name: 'A', seatQuantity: 40, classTeacherId: 'TCH-1', subjectIds: ['SUB-1', 'SUB-2', 'SUB-3', 'SUB-4', 'SUB-5'] }, { id: 'SEC-1B', name: 'B', seatQuantity: 40, classTeacherId: 'TCH-2', subjectIds: ['SUB-1', 'SUB-2', 'SUB-3', 'SUB-4', 'SUB-5'] }], subjectIds: ['SUB-1', 'SUB-2', 'SUB-3', 'SUB-4', 'SUB-5'], startTime: '07:30', endTime: '14:30', createdAt: '2024-08-01', updatedAt: '2024-08-01' },
    { id: 'CLS-2', name: 'Class 7', nameBn: 'সপ্তম শ্রেণি', sections: [{ id: 'SEC-2A', name: 'A', seatQuantity: 40, classTeacherId: 'TCH-3', subjectIds: ['SUB-1', 'SUB-2', 'SUB-3', 'SUB-4', 'SUB-5'] }], subjectIds: ['SUB-1', 'SUB-2', 'SUB-3', 'SUB-4', 'SUB-5'], startTime: '07:30', endTime: '14:30', createdAt: '2024-08-01', updatedAt: '2024-08-01' },
    { id: 'CLS-3', name: 'Class 8', nameBn: 'অষ্টম শ্রেণি', sections: [{ id: 'SEC-3A', name: 'A', seatQuantity: 40, classTeacherId: 'TCH-4', subjectIds: ['SUB-1', 'SUB-2', 'SUB-3', 'SUB-4', 'SUB-5'] }], subjectIds: ['SUB-1', 'SUB-2', 'SUB-3', 'SUB-4', 'SUB-5'], startTime: '07:30', endTime: '14:30', createdAt: '2024-08-01', updatedAt: '2024-08-01' },
  ],
  departments: [
    { id: 'DEPT-1', name: 'Science', nameBn: 'বিজ্ঞান', head: 'TCH-1', createdAt: '2024-08-01', updatedAt: '2024-08-01' },
    { id: 'DEPT-2', name: 'Humanities', nameBn: 'মানবিক', head: 'TCH-2', createdAt: '2024-08-01', updatedAt: '2024-08-01' },
    { id: 'DEPT-3', name: 'Language', nameBn: 'ভাষা', head: 'TCH-3', createdAt: '2024-08-01', updatedAt: '2024-08-01' },
  ],
  subjects: [
    { id: 'SUB-1', name: 'Bangla', nameBn: 'বাংলা', departmentId: 'DEPT-3', departmentIds: ['DEPT-3'], createdAt: '2024-08-01', updatedAt: '2024-08-01' },
    { id: 'SUB-2', name: 'English', nameBn: 'ইংরেজি', departmentId: 'DEPT-3', departmentIds: ['DEPT-3'], createdAt: '2024-08-01', updatedAt: '2024-08-01' },
    { id: 'SUB-3', name: 'Mathematics', nameBn: 'গণিত', departmentId: 'DEPT-1', departmentIds: ['DEPT-1'], createdAt: '2024-08-01', updatedAt: '2024-08-01' },
    { id: 'SUB-4', name: 'Science', nameBn: 'বিজ্ঞান', departmentId: 'DEPT-1', departmentIds: ['DEPT-1'], createdAt: '2024-08-01', updatedAt: '2024-08-01' },
    { id: 'SUB-5', name: 'ICT', nameBn: 'তথ্য ও যোগাযোগ প্রযুক্তি', departmentId: 'DEPT-1', departmentIds: ['DEPT-1'], createdAt: '2024-08-01', updatedAt: '2024-08-01' },
  ],
  designations: [
    { id: 'DES-1', name: 'Head Teacher', nameBn: 'প্রধান শিক্ষক', createdAt: '2024-08-01', updatedAt: '2024-08-01' },
    { id: 'DES-2', name: 'Senior Teacher', nameBn: 'জ্যেষ্ঠ শিক্ষক', createdAt: '2024-08-01', updatedAt: '2024-08-01' },
    { id: 'DES-3', name: 'Teacher', nameBn: 'শিক্ষক', createdAt: '2024-08-01', updatedAt: '2024-08-01' },
  ],
  teachers: [
    T({ id: 'TCH-1', nameEn: 'Dr. Rafiqul Islam', nameBn: 'ড. রফিকুল ইসলাম', gender: 'male', dob: '1975-03-15', phone: '+880-1711-111111', email: 'rafiq@sunrise.edu.bd', address: 'Banani, Dhaka', departmentId: 'DEPT-1', subjectIds: ['SUB-3', 'SUB-4'], designation: 'DES-1', qualification: 'PhD in Mathematics', experience: '20', joiningDate: '2005-01-01', salary: 65000 }),
    T({ id: 'TCH-2', nameEn: 'Fatima Begum', nameBn: 'ফাতেমা বেগম', gender: 'female', dob: '1982-07-20', phone: '+880-1722-222222', email: 'fatima@sunrise.edu.bd', address: 'Gulshan, Dhaka', departmentId: 'DEPT-2', subjectIds: ['SUB-1'], designation: 'DES-2', qualification: 'M.A. in Bangla', experience: '12', joiningDate: '2013-06-01', salary: 45000 }),
    T({ id: 'TCH-3', nameEn: 'Kamal Hossain', nameBn: 'কামাল হোসেন', gender: 'male', dob: '1985-11-10', phone: '+880-1733-333333', email: 'kamal@sunrise.edu.bd', address: 'Uttara, Dhaka', departmentId: 'DEPT-3', subjectIds: ['SUB-2'], designation: 'DES-3', qualification: 'M.A. in English', experience: '8', joiningDate: '2017-01-01', salary: 38000 }),
    T({ id: 'TCH-4', nameEn: 'Nasreen Akter', nameBn: 'নাসরিন আক্তার', gender: 'female', dob: '1988-05-25', phone: '+880-1744-444444', email: 'nasreen@sunrise.edu.bd', address: 'Mirpur, Dhaka', departmentId: 'DEPT-1', subjectIds: ['SUB-5'], designation: 'DES-3', qualification: 'B.Sc. in CSE', experience: '5', joiningDate: '2020-07-01', salary: 35000 }),
  ],
  students: [
    S({ id: 'STU-1', nameEn: 'Ahmed Hassan', nameBn: 'আহমেদ হাসান', class: '6', section: 'A', roll: '1', teacherId: 'TCH-1', dob: '2012-03-15', gender: 'male', bloodGroup: 'A+', religion: 'Islam', presentAddress: 'Banani, Dhaka', permanentAddress: 'Banani, Dhaka', district: 'Dhaka', fatherNameEn: 'Hassan Ahmed', fatherNameBn: 'হাসান আহমেদ', fatherOccupation: 'Business', fatherPhone: '+880-1711-000001', fatherNid: '1000000001', motherNameEn: 'Rahima Ahmed', motherNameBn: 'রহিমা আহমেদ', motherOccupation: 'Teacher', motherPhone: '+880-1711-000002', motherNid: '1000000003' }),
    S({ id: 'STU-2', nameEn: 'Sara Khan', nameBn: 'সারা খান', class: '6', section: 'A', roll: '2', teacherId: 'TCH-1', dob: '2012-07-22', gender: 'female', bloodGroup: 'B+', religion: 'Islam', presentAddress: 'Gulshan, Dhaka', permanentAddress: 'Gulshan, Dhaka', district: 'Dhaka', fatherNameEn: 'Khan Mohammad', fatherNameBn: 'খান মোহাম্মদ', fatherOccupation: 'Engineer', fatherPhone: '+880-1711-000003', fatherNid: '1000000005', motherNameEn: 'Nargis Khan', motherNameBn: 'নার্গিস খান', motherOccupation: 'Doctor', motherPhone: '+880-1711-000004', motherNid: '1000000006' }),
    S({ id: 'STU-3', nameEn: 'Tanvir Rahman', nameBn: 'তানভীর রহমান', class: '7', section: 'A', roll: '1', teacherId: 'TCH-3', dob: '2011-01-05', gender: 'male', bloodGroup: 'O-', religion: 'Islam', presentAddress: 'Uttara, Dhaka', permanentAddress: 'Uttara, Dhaka', district: 'Dhaka', fatherNameEn: 'Rahman Ali', fatherNameBn: 'রহমান আলী', fatherOccupation: 'Government Service', fatherPhone: '+880-1711-000005', fatherNid: '1000000007', motherNameEn: 'Aklima Rahman', motherNameBn: 'আকলিমা রহমান', motherOccupation: 'Housewife', motherPhone: '+880-1711-000006', motherNid: '1000000008' }),
    S({ id: 'STU-4', nameEn: 'Nusrat Jahan', nameBn: 'নুসরাত জাহান', class: '7', section: 'A', roll: '2', teacherId: 'TCH-3', dob: '2011-09-18', gender: 'female', bloodGroup: 'A-', religion: 'Islam', presentAddress: 'Mirpur, Dhaka', permanentAddress: 'Mirpur, Dhaka', district: 'Dhaka', fatherNameEn: 'Jahan Ali', fatherNameBn: 'জাহান আলী', fatherOccupation: 'Business', fatherPhone: '+880-1711-000007', fatherNid: '1000000009', motherNameEn: 'Roksana Jahan', motherNameBn: 'রোকসানা জাহান', motherOccupation: 'Teacher', motherPhone: '+880-1711-000008', motherNid: '1000000010' }),
    S({ id: 'STU-5', nameEn: 'Imran Hossain', nameBn: 'ইমরান হোসেন', class: '8', section: 'A', roll: '1', teacherId: 'TCH-4', dob: '2010-04-12', gender: 'male', bloodGroup: 'B-', religion: 'Islam', presentAddress: 'Banani, Dhaka', permanentAddress: 'Banani, Dhaka', district: 'Dhaka', fatherNameEn: 'Hossain Mia', fatherNameBn: 'হোসেন মিয়া', fatherOccupation: 'Doctor', fatherPhone: '+880-1711-000009', fatherNid: '1000000011', motherNameEn: 'Salma Hossain', motherNameBn: 'সালমা হোসেন', motherOccupation: 'Housewife', motherPhone: '+880-1711-000010', motherNid: '1000000012' }),
  ],
  feeCategories: [
    { id: 'FC-1', name: 'Monthly Fee', nameBn: 'মাসিক ফি', description: 'Monthly tuition fees', descriptionBn: 'মাসিক টিউশন ফি', type: 'monthly', isActive: true, createdAt: '2024-08-01' },
    { id: 'FC-2', name: 'Admission Fee', nameBn: 'ভর্তি ফি', description: 'One-time admission fees', descriptionBn: 'এককালীন ভর্তি ফি', type: 'onetime', isActive: true, createdAt: '2024-08-01' },
  ],
  feeStructures: [
    { id: 'FS-1', name: 'Tuition Fee Class 6', nameBn: 'ষষ্ঠ শ্রেণি টিউশন ফি', class: '6', academicYear: '2025-26', amount: 2500, description: 'Monthly tuition for Class 6', descriptionBn: 'ষষ্ঠ শ্রেণির মাসিক টিউশন', isActive: true, type: 'monthly', categoryId: 'FC-1', createdAt: '2024-08-01' },
    { id: 'FS-2', name: 'Tuition Fee Class 7', nameBn: 'সপ্তম শ্রেণি টিউশন ফি', class: '7', academicYear: '2025-26', amount: 3000, description: 'Monthly tuition for Class 7', descriptionBn: 'সপ্তম শ্রেণির মাসিক টিউশন', isActive: true, type: 'monthly', categoryId: 'FC-1', createdAt: '2024-08-01' },
    { id: 'FS-3', name: 'Tuition Fee Class 8', nameBn: 'অষ্টম শ্রেণি টিউশন ফি', class: '8', academicYear: '2025-26', amount: 3500, description: 'Monthly tuition for Class 8', descriptionBn: 'অষ্টম শ্রেণির মাসিক টিউশন', isActive: true, type: 'monthly', categoryId: 'FC-1', createdAt: '2024-08-01' },
    { id: 'FS-4', name: 'Admission Fee', nameBn: 'ভর্তি ফি', class: 'all', academicYear: '2025-26', amount: 5000, description: 'One-time admission fee', descriptionBn: 'এককালীন ভর্তি ফি', isActive: true, type: 'onetime', categoryId: 'FC-2', createdAt: '2024-08-01' },
  ],
  feePayments: [
    { id: 'PAY-1', studentId: 'STU-1', feeStructureId: 'FS-1', amount: 2500, discount: 0, paidAt: '2025-07-01', method: 'cash', reference: '', note: 'July fee', collectedBy: 'admin', createdAt: '2025-07-01' },
    { id: 'PAY-2', studentId: 'STU-2', feeStructureId: 'FS-1', amount: 2500, discount: 250, paidAt: '2025-07-01', method: 'cash', reference: '', note: 'July fee with discount', collectedBy: 'admin', createdAt: '2025-07-01' },
    { id: 'PAY-3', studentId: 'STU-3', feeStructureId: 'FS-2', amount: 3000, discount: 0, paidAt: '2025-07-01', method: 'bank', reference: 'BKT-001', note: 'July fee', collectedBy: 'admin', createdAt: '2025-07-01' },
  ],
}

const disData: InstitutionData = {
  institution: {
    name: 'Dhaka International School',
    nameBn: 'ঢাকা ইন্টারন্যাশনাল স্কুল',
    logo: '',
    banner: '',
    bannerPosition: { x: 0, y: 0 },
    brandName: 'EduTech',
    motto: 'Excellence in Education',
    mottoBn: 'শিক্ষায় উৎকর্ষ',
    eiin: '234567',
    phone: '+880-1812-456789',
    email: 'info@dis.edu.bd',
    address: 'Gulshan, Dhaka 1212',
    website: 'www.dis.edu.bd',
    subjects: ['Bangla', 'English', 'Mathematics', 'Physics', 'Chemistry', 'Biology'],
    startTime: '08:00',
    endTime: '15:00',
    breaks: [{ id: 'BRK-1', label: 'Break', start: '10:30', end: '11:00' }, { id: 'BRK-2', label: 'Lunch', start: '12:30', end: '13:00' }],
    currentSession: '2025-26',
    sessions: ['2024-25', '2025-26'],
    lightColors: makeColors('#3b82f6'),
    darkColors: makeDarkColors('#3b82f6'),
  },
  classes: [
    { id: 'CLS-1', name: 'Class 9', nameBn: 'নবম শ্রেণি', sections: [{ id: 'SEC-1A', name: 'Science', seatQuantity: 40, classTeacherId: 'TCH-1', subjectIds: ['SUB-1', 'SUB-2', 'SUB-3', 'SUB-4', 'SUB-5', 'SUB-6'] }, { id: 'SEC-1B', name: 'Commerce', seatQuantity: 40, classTeacherId: 'TCH-2', subjectIds: ['SUB-1', 'SUB-2', 'SUB-3'] }], subjectIds: ['SUB-1', 'SUB-2', 'SUB-3', 'SUB-4', 'SUB-5', 'SUB-6'], startTime: '08:00', endTime: '15:00', createdAt: '2024-06-20', updatedAt: '2024-06-20' },
    { id: 'CLS-2', name: 'Class 10', nameBn: 'দশম শ্রেণি', sections: [{ id: 'SEC-2A', name: 'Science', seatQuantity: 40, classTeacherId: 'TCH-3', subjectIds: ['SUB-1', 'SUB-2', 'SUB-3', 'SUB-4', 'SUB-5', 'SUB-6'] }], subjectIds: ['SUB-1', 'SUB-2', 'SUB-3', 'SUB-4', 'SUB-5', 'SUB-6'], startTime: '08:00', endTime: '15:00', createdAt: '2024-06-20', updatedAt: '2024-06-20' },
  ],
  departments: [
    { id: 'DEPT-1', name: 'Science', nameBn: 'বিজ্ঞান বিভাগ', head: 'TCH-1', createdAt: '2024-06-20', updatedAt: '2024-06-20' },
    { id: 'DEPT-2', name: 'Commerce', nameBn: 'বাণিজ্য বিভাগ', head: 'TCH-2', createdAt: '2024-06-20', updatedAt: '2024-06-20' },
  ],
  subjects: [
    { id: 'SUB-1', name: 'Bangla', nameBn: 'বাংলা', departmentId: 'DEPT-1', departmentIds: ['DEPT-1', 'DEPT-2'], createdAt: '2024-06-20', updatedAt: '2024-06-20' },
    { id: 'SUB-2', name: 'English', nameBn: 'ইংরেজি', departmentId: 'DEPT-1', departmentIds: ['DEPT-1', 'DEPT-2'], createdAt: '2024-06-20', updatedAt: '2024-06-20' },
    { id: 'SUB-3', name: 'Mathematics', nameBn: 'গণিত', departmentId: 'DEPT-1', departmentIds: ['DEPT-1', 'DEPT-2'], createdAt: '2024-06-20', updatedAt: '2024-06-20' },
    { id: 'SUB-4', name: 'Physics', nameBn: 'পদার্থবিজ্ঞান', departmentId: 'DEPT-1', departmentIds: ['DEPT-1'], createdAt: '2024-06-20', updatedAt: '2024-06-20' },
    { id: 'SUB-5', name: 'Chemistry', nameBn: 'রসায়ন', departmentId: 'DEPT-1', departmentIds: ['DEPT-1'], createdAt: '2024-06-20', updatedAt: '2024-06-20' },
    { id: 'SUB-6', name: 'Biology', nameBn: 'জীববিজ্ঞান', departmentId: 'DEPT-1', departmentIds: ['DEPT-1'], createdAt: '2024-06-20', updatedAt: '2024-06-20' },
  ],
  designations: [
    { id: 'DES-1', name: 'Principal', nameBn: 'অধ্যক্ষ', createdAt: '2024-06-20', updatedAt: '2024-06-20' },
    { id: 'DES-2', name: 'Vice Principal', nameBn: 'উপাধ্যক্ষ', createdAt: '2024-06-20', updatedAt: '2024-06-20' },
    { id: 'DES-3', name: 'Teacher', nameBn: 'শিক্ষক', createdAt: '2024-06-20', updatedAt: '2024-06-20' },
  ],
  teachers: [
    T({ id: 'TCH-1', nameEn: 'Prof. Aminul Haq', nameBn: 'প্রফ. আমিনুল হক', gender: 'male', dob: '1970-01-10', phone: '+880-1811-111111', email: 'aminul@dis.edu.bd', address: 'Gulshan, Dhaka', departmentId: 'DEPT-1', subjectIds: ['SUB-4', 'SUB-5'], designation: 'DES-1', qualification: 'PhD in Physics', experience: '25', joiningDate: '2000-01-01', salary: 85000 }),
    T({ id: 'TCH-2', nameEn: 'Sabrina Ahmed', nameBn: 'সাবরিনা আহমেদ', gender: 'female', dob: '1978-06-15', phone: '+880-1822-222222', email: 'sabrina@dis.edu.bd', address: 'Dhanmondi, Dhaka', departmentId: 'DEPT-2', subjectIds: ['SUB-1', 'SUB-2'], designation: 'DES-2', qualification: 'MBA', experience: '15', joiningDate: '2010-01-01', salary: 55000 }),
    T({ id: 'TCH-3', nameEn: 'Dr. Karim Uddin', nameBn: 'ড. করিম উদ্দিন', gender: 'male', dob: '1980-09-20', phone: '+880-1833-333333', email: 'karim@dis.edu.bd', address: 'Banani, Dhaka', departmentId: 'DEPT-1', subjectIds: ['SUB-3', 'SUB-6'], designation: 'DES-3', qualification: 'PhD in Mathematics', experience: '10', joiningDate: '2015-07-01', salary: 48000 }),
  ],
  students: [
    S({ id: 'STU-1', nameEn: 'Tasnim Rahman', nameBn: 'তাসনিম রহমান', class: '9', section: 'Science', roll: '1', teacherId: 'TCH-1', dob: '2009-05-10', gender: 'female', bloodGroup: 'A+', religion: 'Islam', presentAddress: 'Gulshan, Dhaka', permanentAddress: 'Gulshan, Dhaka', district: 'Dhaka', fatherNameEn: 'Rahman Khan', fatherNameBn: 'রহমান খান', fatherOccupation: 'Businessman', fatherPhone: '+880-1811-000001', fatherNid: '2000000001', motherNameEn: 'Farida Rahman', motherNameBn: 'ফরিদা রহমান', motherOccupation: 'Doctor', motherPhone: '+880-1811-000002', motherNid: '2000000002' }),
    S({ id: 'STU-2', nameEn: 'Rakibul Hasan', nameBn: 'রাকিবুল হাসান', class: '9', section: 'Science', roll: '2', teacherId: 'TCH-1', dob: '2009-08-25', gender: 'male', bloodGroup: 'O+', religion: 'Islam', presentAddress: 'Dhanmondi, Dhaka', permanentAddress: 'Dhanmondi, Dhaka', district: 'Dhaka', fatherNameEn: 'Hasan Mahmud', fatherNameBn: 'হাসান মাহমুদ', fatherOccupation: 'Engineer', fatherPhone: '+880-1811-000003', fatherNid: '2000000003', motherNameEn: 'Lamia Hasan', motherNameBn: 'লামিয়া হাসান', motherOccupation: 'Teacher', motherPhone: '+880-1811-000004', motherNid: '2000000004' }),
    S({ id: 'STU-3', nameEn: 'Sumaiya Khatun', nameBn: 'সুমাইয়া খাতুন', class: '10', section: 'Science', roll: '1', teacherId: 'TCH-3', dob: '2008-12-01', gender: 'female', bloodGroup: 'B-', religion: 'Islam', presentAddress: 'Banani, Dhaka', permanentAddress: 'Banani, Dhaka', district: 'Dhaka', fatherNameEn: 'Khatun Ali', fatherNameBn: 'খাতুন আলী', fatherOccupation: 'Lawyer', fatherPhone: '+880-1811-000005', fatherNid: '2000000005', motherNameEn: 'Razia Khatun', motherNameBn: 'রাজিয়া খাতুন', motherOccupation: 'Housewife', motherPhone: '+880-1811-000006', motherNid: '2000000006' }),
  ],
  feeCategories: [
    { id: 'FC-1', name: 'Monthly Fee', nameBn: 'মাসিক ফি', description: 'Monthly tuition fees', descriptionBn: 'মাসিক টিউশন ফি', type: 'monthly', isActive: true, createdAt: '2024-06-20' },
  ],
  feeStructures: [
    { id: 'FS-1', name: 'Tuition Fee Class 9', nameBn: 'নবম শ্রেণি টিউশন ফি', class: '9', academicYear: '2025-26', amount: 5000, description: 'Monthly tuition for Class 9', descriptionBn: 'নবম শ্রেণির মাসিক টিউশন', isActive: true, type: 'monthly', categoryId: 'FC-1', createdAt: '2024-06-20' },
    { id: 'FS-2', name: 'Tuition Fee Class 10', nameBn: 'দশম শ্রেণি টিউশন ফি', class: '10', academicYear: '2025-26', amount: 5500, description: 'Monthly tuition for Class 10', descriptionBn: 'দশম শ্রেণির মাসিক টিউশন', isActive: true, type: 'monthly', categoryId: 'FC-1', createdAt: '2024-06-20' },
  ],
  feePayments: [
    { id: 'PAY-1', studentId: 'STU-1', feeStructureId: 'FS-1', amount: 5000, discount: 0, paidAt: '2025-07-01', method: 'bank', reference: 'BKT-001', note: 'July fee', collectedBy: 'admin', createdAt: '2025-07-01' },
    { id: 'PAY-2', studentId: 'STU-2', feeStructureId: 'FS-1', amount: 5000, discount: 500, paidAt: '2025-07-01', method: 'mobile', reference: 'BKH-001', note: 'July fee with scholarship', collectedBy: 'admin', createdAt: '2025-07-01' },
  ],
}

const greenValleyData: InstitutionData = {
  institution: {
    name: 'Green Valley School',
    nameBn: 'গ্রিন ভ্যালি স্কুল',
    logo: '',
    banner: '',
    bannerPosition: { x: 0, y: 0 },
    brandName: 'EduTech',
    motto: 'Learning for Life',
    mottoBn: 'আজীবন শিক্ষা',
    eiin: '345678',
    phone: '+880-1912-567890',
    email: 'contact@greenvalley.edu.bd',
    address: 'Uttara, Dhaka 1230',
    website: 'www.greenvalley.edu.bd',
    subjects: ['Bangla', 'English', 'Mathematics', 'Science'],
    startTime: '08:00',
    endTime: '13:00',
    breaks: [{ id: 'BRK-1', label: 'Tiffin', start: '10:30', end: '11:00' }],
    currentSession: '2025-26',
    sessions: ['2025-26'],
    lightColors: makeColors('#22c55e'),
    darkColors: makeDarkColors('#22c55e'),
  },
  classes: [
    { id: 'CLS-1', name: 'Class 1', nameBn: 'প্রথম শ্রেণি', sections: [{ id: 'SEC-1A', name: 'A', seatQuantity: 30, classTeacherId: 'TCH-1', subjectIds: ['SUB-1', 'SUB-2', 'SUB-3', 'SUB-4'] }], subjectIds: ['SUB-1', 'SUB-2', 'SUB-3', 'SUB-4'], startTime: '08:00', endTime: '13:00', createdAt: '2026-07-01', updatedAt: '2026-07-01' },
    { id: 'CLS-2', name: 'Class 2', nameBn: 'দ্বিতীয় শ্রেণি', sections: [{ id: 'SEC-2A', name: 'A', seatQuantity: 30, classTeacherId: 'TCH-2', subjectIds: ['SUB-1', 'SUB-2', 'SUB-3', 'SUB-4'] }], subjectIds: ['SUB-1', 'SUB-2', 'SUB-3', 'SUB-4'], startTime: '08:00', endTime: '13:00', createdAt: '2026-07-01', updatedAt: '2026-07-01' },
  ],
  departments: [
    { id: 'DEPT-1', name: 'Primary', nameBn: 'প্রাথমিক', head: 'TCH-1', createdAt: '2026-07-01', updatedAt: '2026-07-01' },
  ],
  subjects: [
    { id: 'SUB-1', name: 'Bangla', nameBn: 'বাংলা', departmentId: 'DEPT-1', departmentIds: ['DEPT-1'], createdAt: '2026-07-01', updatedAt: '2026-07-01' },
    { id: 'SUB-2', name: 'English', nameBn: 'ইংরেজি', departmentId: 'DEPT-1', departmentIds: ['DEPT-1'], createdAt: '2026-07-01', updatedAt: '2026-07-01' },
    { id: 'SUB-3', name: 'Mathematics', nameBn: 'গণিত', departmentId: 'DEPT-1', departmentIds: ['DEPT-1'], createdAt: '2026-07-01', updatedAt: '2026-07-01' },
    { id: 'SUB-4', name: 'Science', nameBn: 'বিজ্ঞান', departmentId: 'DEPT-1', departmentIds: ['DEPT-1'], createdAt: '2026-07-01', updatedAt: '2026-07-01' },
  ],
  designations: [
    { id: 'DES-1', name: 'Head Teacher', nameBn: 'প্রধান শিক্ষক', createdAt: '2026-07-01', updatedAt: '2026-07-01' },
    { id: 'DES-2', name: 'Teacher', nameBn: 'শিক্ষক', createdAt: '2026-07-01', updatedAt: '2026-07-01' },
  ],
  teachers: [
    T({ id: 'TCH-1', nameEn: 'Ruma Begum', nameBn: 'রুমা বেগম', gender: 'female', dob: '1990-04-15', phone: '+880-1911-111111', email: 'ruma@greenvalley.edu.bd', address: 'Uttara, Dhaka', departmentId: 'DEPT-1', subjectIds: ['SUB-1', 'SUB-3'], designation: 'DES-1', qualification: 'B.Ed', experience: '8', joiningDate: '2026-07-01', salary: 30000 }),
    T({ id: 'TCH-2', nameEn: 'Tanvir Alam', nameBn: 'তানভীর আলম', gender: 'male', dob: '1995-08-20', phone: '+880-1922-222222', email: 'tanvir@greenvalley.edu.bd', address: 'Uttara, Dhaka', departmentId: 'DEPT-1', subjectIds: ['SUB-2', 'SUB-4'], designation: 'DES-2', qualification: 'B.Sc', experience: '3', joiningDate: '2026-07-01', salary: 20000 }),
  ],
  students: [
    S({ id: 'STU-1', nameEn: 'Zara Patel', nameBn: 'যারা প্যাটেল', class: '1', section: 'A', roll: '1', teacherId: 'TCH-1', dob: '2018-02-10', gender: 'female', bloodGroup: 'O+', religion: 'Hindu', presentAddress: 'Uttara, Dhaka', permanentAddress: 'Uttara, Dhaka', district: 'Dhaka', fatherNameEn: 'Raj Patel', fatherNameBn: 'রাজ প্যাটেল', fatherOccupation: 'Business', fatherPhone: '+880-1911-000001', fatherNid: '3000000001', motherNameEn: 'Mina Patel', motherNameBn: 'মীনা প্যাটেল', motherOccupation: 'Housewife', motherPhone: '+880-1911-000002', motherNid: '3000000002' }),
  ],
  feeCategories: [
    { id: 'FC-1', name: 'Monthly Fee', nameBn: 'মাসিক ফি', description: 'Monthly tuition fees', descriptionBn: 'মাসিক টিউশন ফি', type: 'monthly', isActive: true, createdAt: '2026-07-01' },
  ],
  feeStructures: [
    { id: 'FS-1', name: 'Tuition Fee Class 1-2', nameBn: '১-২ শ্রেণি টিউশন ফি', class: '1', academicYear: '2025-26', amount: 1500, description: 'Monthly tuition for Class 1-2', descriptionBn: '১-২ শ্রেণির মাসিক টিউশন', isActive: true, type: 'monthly', categoryId: 'FC-1', createdAt: '2026-07-01' },
  ],
  feePayments: [],
}

const rajshahiData: InstitutionData = {
  institution: {
    name: 'Rajshahi Collegiate School',
    nameBn: 'রাজশাহী কলেজিয়েট স্কুল',
    logo: '',
    banner: '',
    bannerPosition: { x: 0, y: 0 },
    brandName: 'EduTech',
    motto: 'Truth and Light',
    mottoBn: 'সত্য ও আলো',
    eiin: '456789',
    phone: '+880-1712-678901',
    email: 'admin@rajshahi-cs.edu.bd',
    address: 'Boalia, Rajshahi 6205',
    website: 'www.rajshahi-cs.edu.bd',
    subjects: ['Bangla', 'English', 'Mathematics', 'Physics', 'Chemistry'],
    startTime: '09:00',
    endTime: '15:30',
    breaks: [{ id: 'BRK-1', label: 'Break', start: '11:30', end: '12:00' }],
    currentSession: '2025-26',
    sessions: ['2024-25', '2025-26'],
    lightColors: makeColors('#f59e0b'),
    darkColors: makeDarkColors('#f59e0b'),
  },
  classes: [
    { id: 'CLS-1', name: 'Class 5', nameBn: 'পঞ্চম শ্রেণি', sections: [{ id: 'SEC-1A', name: 'A', seatQuantity: 35, classTeacherId: 'TCH-1', subjectIds: ['SUB-1', 'SUB-2', 'SUB-3', 'SUB-4', 'SUB-5'] }], subjectIds: ['SUB-1', 'SUB-2', 'SUB-3', 'SUB-4', 'SUB-5'], startTime: '09:00', endTime: '15:30', createdAt: '2025-11-10', updatedAt: '2025-11-10' },
  ],
  departments: [
    { id: 'DEPT-1', name: 'General', nameBn: 'সাধারণ', head: 'TCH-1', createdAt: '2025-11-10', updatedAt: '2025-11-10' },
  ],
  subjects: [
    { id: 'SUB-1', name: 'Bangla', nameBn: 'বাংলা', departmentId: 'DEPT-1', departmentIds: ['DEPT-1'], createdAt: '2025-11-10', updatedAt: '2025-11-10' },
    { id: 'SUB-2', name: 'English', nameBn: 'ইংরেজি', departmentId: 'DEPT-1', departmentIds: ['DEPT-1'], createdAt: '2025-11-10', updatedAt: '2025-11-10' },
    { id: 'SUB-3', name: 'Mathematics', nameBn: 'গণিত', departmentId: 'DEPT-1', departmentIds: ['DEPT-1'], createdAt: '2025-11-10', updatedAt: '2025-11-10' },
    { id: 'SUB-4', name: 'Physics', nameBn: 'পদার্থবিজ্ঞান', departmentId: 'DEPT-1', departmentIds: ['DEPT-1'], createdAt: '2025-11-10', updatedAt: '2025-11-10' },
    { id: 'SUB-5', name: 'Chemistry', nameBn: 'রসায়ন', departmentId: 'DEPT-1', departmentIds: ['DEPT-1'], createdAt: '2025-11-10', updatedAt: '2025-11-10' },
  ],
  designations: [
    { id: 'DES-1', name: 'Head Master', nameBn: 'প্রধান শিক্ষক', createdAt: '2025-11-10', updatedAt: '2025-11-10' },
  ],
  teachers: [
    T({ id: 'TCH-1', nameEn: 'Abdur Rouf', nameBn: 'আব্দুর রউফ', gender: 'male', dob: '1975-12-01', phone: '+880-1711-666661', email: 'rouf@rajshahi-cs.edu.bd', address: 'Boalia, Rajshahi', departmentId: 'DEPT-1', subjectIds: ['SUB-1', 'SUB-3'], designation: 'DES-1', qualification: 'M.Ed', experience: '22', joiningDate: '2003-01-01', salary: 55000 }),
  ],
  students: [
    S({ id: 'STU-1', nameEn: 'Rafiq Uddin', nameBn: 'রফিক উদ্দিন', class: '5', section: 'A', roll: '1', teacherId: 'TCH-1', dob: '2013-06-15', gender: 'male', bloodGroup: 'B+', religion: 'Islam', presentAddress: 'Boalia, Rajshahi', permanentAddress: 'Boalia, Rajshahi', district: 'Rajshahi', fatherNameEn: 'Uddin Miah', fatherNameBn: 'উদ্দিন মিয়া', fatherOccupation: 'Farmer', fatherPhone: '+880-1711-777771', fatherNid: '4000000001', motherNameEn: 'Rahima Khatun', motherNameBn: 'রহিমা খাতুন', motherOccupation: 'Housewife', motherPhone: '+880-1711-777772', motherNid: '4000000002' }),
  ],
  feeCategories: [],
  feeStructures: [],
  feePayments: [],
}

export const institutionDataMap: Record<string, InstitutionData> = {
  'INST-001': sunriseData,
  'INST-002': disData,
  'INST-003': greenValleyData,
  'INST-004': rajshahiData,
}
