/**
 * Application-wide constants: dropdown options, grade scales, and default institution config.
 * All bilingual options use `{ value, labelEn, labelBn }` shape.
 */
export const LOGIN_PATH = import.meta.env.VITE_LOGIN_PATH || '/login'

export const BLOOD_GROUPS = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
]

export const TEACHER_CATEGORIES = [
  'Teacher', 'Staff', 'Employee', 'Admin', 'Librarian', 'Accountant'
]

export const GENDER_OPTIONS = [
  { value: 'Male', labelEn: 'Male', labelBn: 'পুরুষ' },
  { value: 'Female', labelEn: 'Female', labelBn: 'মহিলা' },
  { value: 'Other', labelEn: 'Other', labelBn: 'অন্যান্য' },
]

export const TEACHER_GENDER_OPTIONS = [
  { value: 'Male', labelEn: 'Male', labelBn: 'পুরুষ' },
  { value: 'Female', labelEn: 'Female', labelBn: 'মহিলা' },
]

export const TEACHER_STATUS_OPTIONS = [
  { value: 'active', labelEn: 'Active', labelBn: 'সক্রিয়' },
  { value: 'inactive', labelEn: 'Inactive', labelBn: 'নিষ্ক্রিয়' },
  { value: 'on-leave', labelEn: 'On Leave', labelBn: 'ছুটিতে' },
]

export const STUDENT_STATUS_OPTIONS = [
  { value: 'active', labelEn: 'Active', labelBn: 'সক্রিয়' },
  { value: 'inactive', labelEn: 'Inactive', labelBn: 'নিষ্ক্রিয়' },
]

export const RELIGION_OPTIONS = [
  { value: 'Islam', labelEn: 'Islam', labelBn: 'ইসলাম' },
  { value: 'Hinduism', labelEn: 'Hinduism', labelBn: 'হিন্দু' },
  { value: 'Christianity', labelEn: 'Christianity', labelBn: 'খ্রিস্টান' },
  { value: 'Buddhism', labelEn: 'Buddhism', labelBn: 'বৌদ্ধ' },
  { value: 'Other', labelEn: 'Other', labelBn: 'অন্যান্য' },
]

export const DISTRICT_OPTIONS = [
  'Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh', 'Other'
]

export const TOPIC_STATUS_OPTIONS = [
  { value: 'pending', labelEn: 'Pending', labelBn: 'বাকি' },
  { value: 'in-progress', labelEn: 'In Progress', labelBn: 'চলমান' },
  { value: 'completed', labelEn: 'Completed', labelBn: 'সম্পন্ন' },
]

export const EXAM_TYPE_OPTIONS = [
  { value: 'semester-1', labelEn: 'Semester 1', labelBn: 'সেমিস্টার ১' },
  { value: 'semester-2', labelEn: 'Semester 2', labelBn: 'সেমিস্টার ২' },
  { value: 'annual', labelEn: 'Annual', labelBn: 'বার্ষিক' },
  { value: 'half-yearly', labelEn: 'Half Yearly', labelBn: 'আর্ধবার্ষিক' },
  { value: 'class-test', labelEn: 'Class Test', labelBn: 'ক্লাস টেস্ট' },
  { value: 'custom', labelEn: 'Custom', labelBn: 'কাস্টম' },
]

export const DAYS_OF_WEEK = [
  { value: 0, labelEn: 'Sunday', labelBn: 'রবিবার', shortEn: 'Sun', shortBn: 'রবি' },
  { value: 1, labelEn: 'Monday', labelBn: 'সোমবার', shortEn: 'Mon', shortBn: 'সোম' },
  { value: 2, labelEn: 'Tuesday', labelBn: 'মঙ্গলবার', shortEn: 'Tue', shortBn: 'মঙ্গল' },
  { value: 3, labelEn: 'Wednesday', labelBn: 'বুধবার', shortEn: 'Wed', shortBn: 'বুধ' },
  { value: 4, labelEn: 'Thursday', labelBn: 'বৃহস্পতিবার', shortEn: 'Thu', shortBn: 'বৃহ' },
  { value: 5, labelEn: 'Friday', labelBn: 'শুক্রবার', shortEn: 'Fri', shortBn: 'শুক্র' },
  { value: 6, labelEn: 'Saturday', labelBn: 'শনিবার', shortEn: 'Sat', shortBn: 'শনি' },
]

export const WEEKEND_DAYS = [5]

export const GRADE_SCALE = [
  { grade: 'A+', min: 80, max: 100, gpa: 5.00, color: '#10b981' },
  { grade: 'A', min: 70, max: 79, gpa: 4.00, color: '#34d399' },
  { grade: 'A-', min: 60, max: 69, gpa: 3.50, color: '#6ee7b7' },
  { grade: 'B', min: 50, max: 59, gpa: 3.00, color: '#60a5fa' },
  { grade: 'C', min: 40, max: 49, gpa: 2.00, color: '#fbbf24' },
  { grade: 'D', min: 33, max: 39, gpa: 1.00, color: '#f97316' },
  { grade: 'F', min: 0, max: 32, gpa: 0.00, color: '#ef4444' },
]

export const DEFAULT_INSTITUTION = {
  name: 'Sunrise Academy',
  nameBn: 'সানরাইজ একাডেমি',
  address: 'Dhaka, Bangladesh',
  phone: '+8801XXXXXXXXX',
  email: 'info@sunriseacademy.edu.bd',
  logo: '',
  currentSession: '2025-26',
  startTime: '07:30',
  endTime: '14:30',
  breaks: [{ id: 'BRK-1', label: 'Tiffin', start: '11:00', end: '11:30' }],
  lightColors: {
    brand: '#4f46e5',
    brandLight: '#eef2ff',
    teal: '#14b8a6',
    green: '#22c55e',
    red: '#ef4444',
    amber: '#f59e0b',
    purple: '#a855f7',
  },
  darkColors: {
    brand: '#6366f1',
    brandLight: '#312e81',
    teal: '#0d9488',
    green: '#16a34a',
    red: '#dc2626',
    amber: '#d97706',
    purple: '#9333ea',
  },
}
