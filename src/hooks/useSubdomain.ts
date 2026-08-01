import { useMemo } from 'react'
import { useSuperAdminStore, type Institution } from '@/store/superAdminStore'

const BASE_DOMAIN = 'smsappbd.vercel.app'

const fallbackInstitutions: Institution[] = [
  {
    id: 'INST-001', name: 'Sunrise Academy', nameBn: 'সানরাইজ একাডেমি',
    email: 'admin@sunrise.edu.bd', phone: '+880-1712-345678',
    address: 'Banani, Dhaka 1213', addressBn: 'বনানী, ঢাকা-১২১৩',
    eiin: '123456', website: 'sunrise.smsappbd.vercel.app', subdomain: 'sunrise',
    status: 'active', package: { name: 'Premium', nameBn: 'প্রিমিয়াম', maxStudents: 400, maxTeachers: 40, maxClasses: 999, storageMB: 10240, price: 3000, duration: 30 },
    usedStorageMB: 4520, createdAt: '2024-08-15', lastLogin: '2026-07-30',
    logo: '', banner: '', brandColor: '#6366f1', brandName: 'EduTech',
    motto: 'Knowledge is Power', mottoBn: 'জ্ঞাই হলো শক্তি',
    startTime: '07:30', endTime: '14:30', optionalSubjects: [], sessions: ['2024-25', '2025-26'],
  },
  {
    id: 'INST-002', name: 'Dhaka International School', nameBn: 'ঢাকা ইন্টারন্যাশনাল স্কুল',
    email: 'info@dis.edu.bd', phone: '+880-1812-456789',
    address: 'Gulshan, Dhaka 1212', addressBn: 'গুলশান, ঢাকা-১২১২',
    eiin: '234567', website: 'dis.smsappbd.vercel.app', subdomain: 'dis',
    status: 'active', package: { name: 'Enterprise', nameBn: 'এন্টারপ্রাইজ', maxStudents: 500, maxTeachers: 50, maxClasses: 999, storageMB: 20480, price: 3500, duration: 30 },
    usedStorageMB: 18750, createdAt: '2024-06-20', lastLogin: '2026-07-31',
    logo: '', banner: '', brandColor: '#3b82f6', brandName: 'EduTech',
    motto: '', mottoBn: '', startTime: '08:00', endTime: '15:00',
    optionalSubjects: [], sessions: ['2024-25', '2025-26'],
  },
  {
    id: 'INST-003', name: 'Green Valley School', nameBn: 'গ্রিন ভ্যালি স্কুল',
    email: 'contact@greenvalley.edu.bd', phone: '+880-1912-567890',
    address: 'Uttara, Dhaka 1230', addressBn: 'উত্তরা, ঢাকা-১২৩০',
    eiin: '345678', website: 'greenvalley.smsappbd.vercel.app', subdomain: 'greenvalley',
    status: 'trial', package: { name: 'Standard', nameBn: 'স্ট্যান্ডার্ড', maxStudents: 250, maxTeachers: 30, maxClasses: 999, storageMB: 5120, price: 2200, duration: 30 },
    usedStorageMB: 340, createdAt: '2026-07-01', lastLogin: '2026-07-28',
    logo: '', banner: '', brandColor: '#22c55e', brandName: 'EduTech',
    motto: '', mottoBn: '', startTime: '07:30', endTime: '14:00',
    optionalSubjects: [], sessions: ['2024-25', '2025-26'],
  },
  {
    id: 'INST-004', name: 'Rajshahi Collegiate School', nameBn: 'রাজশাহী কলেজিয়েট স্কুল',
    email: 'admin@rajshahi-cs.edu.bd', phone: '+880-1712-678901',
    address: 'Boalia, Rajshahi 6205', addressBn: 'বোয়ালিয়া, রাজশাহী-৬২০৫',
    eiin: '456789', website: 'rajshahi-cs.smsappbd.vercel.app', subdomain: 'rajshahi-cs',
    status: 'suspended', package: { name: 'Basic', nameBn: 'বেসিক', maxStudents: 150, maxTeachers: 20, maxClasses: 999, storageMB: 2048, price: 1500, duration: 30 },
    usedStorageMB: 120, createdAt: '2025-11-10', lastLogin: '2026-05-15',
    logo: '', banner: '', brandColor: '#f59e0b', brandName: 'EduTech',
    motto: '', mottoBn: '', startTime: '08:00', endTime: '14:30',
    optionalSubjects: [], sessions: ['2024-25', '2025-26'],
  },
]

export function useSubdomain() {
  const institutions = useSuperAdminStore((s) => s.institutions)

  const result = useMemo(() => {
    const hostname = window.location.hostname
    const pathname = window.location.pathname

    // Check subdomain
    const isSubdomain = hostname !== BASE_DOMAIN && hostname !== `www.${BASE_DOMAIN}` && !hostname.includes('localhost')

    if (isSubdomain) {
      const subdomain = hostname.replace(`.${BASE_DOMAIN}`, '').replace('.localhost', '')
      const allInstitutions = institutions.length > 0 ? institutions : fallbackInstitutions
      const institution = allInstitutions.find((inst) => inst.subdomain === subdomain) || null
      return { isSubdomain: true, institution, subdomain }
    }

    // Check path-based: /i/:subdomain
    const pathMatch = pathname.match(/^\/i\/([^/]+)/)
    if (pathMatch) {
      const subdomain = pathMatch[1]
      const allInstitutions = institutions.length > 0 ? institutions : fallbackInstitutions
      const institution = allInstitutions.find((inst) => inst.subdomain === subdomain) || null
      return { isSubdomain: true, institution, subdomain }
    }

    return { isSubdomain: false, institution: null, subdomain: null }
  }, [institutions])

  return result
}

export { fallbackInstitutions }
