import { useClassStore, defaultThemeColors, defaultThemeColorsDark } from '@/store/classStore'
import { useTeacherStore } from '@/store/teacherStore'
import { useFeeStore } from '@/store/feeStore'
import { useAdmissionStore } from '@/store/admissionStore'
import { useHRStore } from '@/store/hrStore'
import { useExamStore } from '@/store/examStore'
import { useAssignmentStore } from '@/store/assignmentStore'
import { useSyllabusStore } from '@/store/syllabusStore'
import { useOnlineStore } from '@/store/onlineStore'
import { useTodoStore } from '@/store/todoStore'

export function resetAllInstitutionStores(): void {
  useClassStore.setState({
    institution: {
      name: '', nameBn: '', logo: '', banner: '', bannerPosition: { x: 0, y: 0 },
      brandName: 'EduTech', motto: '', mottoBn: '', eiin: '', phone: '', email: '',
      address: '', website: '', subjects: [], startTime: '07:30', endTime: '14:30',
      breaks: [], currentSession: '2025-26', sessions: ['2024-25', '2025-26'],
      lightColors: { ...defaultThemeColors }, darkColors: { ...defaultThemeColorsDark },
    },
    classes: [],
    routines: [],
    sessionClasses: {},
    sessionRoutines: {},
  })
  useTeacherStore.setState({ teachers: [], subjects: [], departments: [], designations: [] })
  useFeeStore.setState({ structures: [], payments: [], feeCategories: [], waiverCategories: [], waiverEntries: [], studentWaivers: [] })
  useAdmissionStore.setState({ students: [] })
  useHRStore.setState({
    increments: [], bonuses: [], promotions: [], funds: [],
    homeworkRecords: [], dailyReports: [], recommendations: [],
    monthlySalaryConfigs: [], facilities: [], teacherFacilities: [],
  })
  useExamStore.setState({
    examConfigs: [], subjectMarkConfigs: [], studentMarks: [], routines: [],
    rooms: [], seatPlans: [], invigilators: [], attendances: [],
    markAdjustments: [], omrConfigs: [], extraMarks: [], extraMarkTypes: [],
    marksheetConfigs: [], generalAbilities: [], gradeScales: [], workingDays: [],
    promotions: [], cumulativeSheets: [], marksEntryStatuses: [], omrTemplates: [],
  })
  useAssignmentStore.setState({ assignments: [], submissions: [] })
  useSyllabusStore.setState({ syllabi: [] })
  useOnlineStore.setState({ classes: [] })
  useTodoStore.setState({ todos: [] })
}
