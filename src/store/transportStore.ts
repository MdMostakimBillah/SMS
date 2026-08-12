import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createNamespacedStorage, registerStoreReset, registerStoreLoad } from '@/lib/storage'

export interface TransportVehicle {
  id: string
  name: string
  nameBn: string
  registrationNo: string
  capacity: number
  driverId: string
  driverName: string
  driverNameBn: string
  driverPhone: string
  driverDetails: string
  vehicleDetails: string
  routeIds: string[]
  isActive: boolean
  createdAt: string
}

export interface TransportRoute {
  id: string
  name: string
  nameBn: string
  stops: string
  stopsBn: string
  distance: string
  fare: number
  isActive: boolean
  createdAt: string
}

export interface TransportAssignment {
  id: string
  studentId: string
  vehicleId: string
  routeId: string
  pickupStop: string
  monthlyFare: number
  assignedDate: string
  isActive: boolean
}

interface TransportState {
  vehicles: TransportVehicle[]
  routes: TransportRoute[]
  assignments: TransportAssignment[]

  addVehicle: (v: TransportVehicle) => void
  updateVehicle: (id: string, data: Partial<TransportVehicle>) => void
  deleteVehicle: (id: string) => void
  toggleVehicleActive: (id: string) => void

  addRoute: (r: TransportRoute) => void
  updateRoute: (id: string, data: Partial<TransportRoute>) => void
  deleteRoute: (id: string) => void
  toggleRouteActive: (id: string) => void

  addAssignment: (a: TransportAssignment) => void
  updateAssignment: (id: string, data: Partial<TransportAssignment>) => void
  deleteAssignment: (id: string) => void
  toggleAssignmentActive: (id: string) => void
}

export const useTransportStore = create<TransportState>()(
  persist(
    (set) => ({
      vehicles: [
        {
          id: 'TV-001',
          name: 'Bus-01',
          nameBn: 'বাস-০১',
          registrationNo: 'ঢাকা মেট্রো গ-১২-৩৪৫৬',
          capacity: 40,
          driverId: '',
          driverName: 'Kamal Hossain',
          driverNameBn: 'কামাল হোসেন',
          driverPhone: '01712345678',
          driverDetails: 'License: DL-2020-1234, Experience: 8 years',
          vehicleDetails: 'Toyota Coaster 2020, Color: White, seats: 40',
          routeIds: ['TR-001', 'TR-002'],
          isActive: true,
          createdAt: '2025-01-15',
        },
        {
          id: 'TV-002',
          name: 'Bus-02',
          nameBn: 'বাস-০২',
          registrationNo: 'ঢাকা মেট্রো খ-৭৮-১২৩৪',
          capacity: 35,
          driverId: '',
          driverName: 'Rafiq Uddin',
          driverNameBn: 'রফিক উদ্দিন',
          driverPhone: '01812345678',
          driverDetails: 'License: DL-2019-5678, Experience: 10 years',
          vehicleDetails: 'Hyundai County 2019, Color: Blue, seats: 35',
          routeIds: ['TR-003'],
          isActive: true,
          createdAt: '2025-02-10',
        },
        {
          id: 'TV-003',
          name: 'Van-01',
          nameBn: 'ভ্যান-০১',
          registrationNo: 'ঢাকা মেট্রো ঙ-৪৫-৬৭৮৯',
          capacity: 15,
          driverId: '',
          driverName: 'Sohel Rana',
          driverNameBn: 'সোহেল রানা',
          driverPhone: '01912345678',
          driverDetails: 'License: DL-2021-9012, Experience: 5 years',
          vehicleDetails: 'Minibus 2021, Color: Yellow, seats: 15',
          routeIds: ['TR-001'],
          isActive: true,
          createdAt: '2025-03-05',
        },
      ],

      routes: [
        {
          id: 'TR-001',
          name: 'Mirpur-10 to School',
          nameBn: 'মিরপুর-১০ থেকে স্কুল',
          stops: 'Mirpur-10, Mirpur-11, Pallabi, School',
          stopsBn: 'মিরপুর-১০, মিরপুর-১১, পল্লবী, স্কুল',
          distance: '5 km',
          fare: 2000,
          isActive: true,
          createdAt: '2025-01-10',
        },
        {
          id: 'TR-002',
          name: 'Uttara to School',
          nameBn: 'উত্তরা থেকে স্কুল',
          stops: 'Uttara Sector-3, Azampur, Tongi, School',
          stopsBn: 'উত্তরা সেক্টর-৩, আজমপুর, টঙ্গী, স্কুল',
          distance: '12 km',
          fare: 3000,
          isActive: true,
          createdAt: '2025-01-10',
        },
        {
          id: 'TR-003',
          name: 'Banani to School',
          nameBn: 'বনানী থেকে স্কুল',
          stops: 'Banani-11, Khilgaon, Motijheel, School',
          stopsBn: 'বনানী-১১, খিলগাঁও, মতিঝিল, স্কুল',
          distance: '8 km',
          fare: 2500,
          isActive: true,
          createdAt: '2025-02-01',
        },
      ],

      assignments: [
        { id: 'TA-001', studentId: 'ET-2025-10001', vehicleId: 'TV-001', routeId: 'TR-001', pickupStop: 'Mirpur-10', monthlyFare: 2000, assignedDate: '2025-01-20', isActive: true },
        { id: 'TA-002', studentId: 'ET-2025-10002', vehicleId: 'TV-001', routeId: 'TR-001', pickupStop: 'Mirpur-11', monthlyFare: 2000, assignedDate: '2025-01-20', isActive: true },
        { id: 'TA-003', studentId: 'ET-2025-10003', vehicleId: 'TV-001', routeId: 'TR-002', pickupStop: 'Uttara Sector-3', monthlyFare: 3000, assignedDate: '2025-02-01', isActive: true },
        { id: 'TA-004', studentId: 'ET-2025-10004', vehicleId: 'TV-002', routeId: 'TR-003', pickupStop: 'Banani-11', monthlyFare: 2500, assignedDate: '2025-02-15', isActive: true },
        { id: 'TA-005', studentId: 'ET-2025-10005', vehicleId: 'TV-003', routeId: 'TR-001', pickupStop: 'Pallabi', monthlyFare: 2000, assignedDate: '2025-03-10', isActive: true },
      ],

      addVehicle: (v) => set((state) => ({ vehicles: [...state.vehicles, v] })),
      updateVehicle: (id, data) =>
        set((state) => ({
          vehicles: state.vehicles.map((v) => (v.id === id ? { ...v, ...data } : v)),
        })),
      deleteVehicle: (id) =>
        set((state) => ({
          vehicles: state.vehicles.filter((v) => v.id !== id),
          assignments: state.assignments.filter((a) => a.vehicleId !== id),
        })),
      toggleVehicleActive: (id) =>
        set((state) => ({
          vehicles: state.vehicles.map((v) => (v.id === id ? { ...v, isActive: !v.isActive } : v)),
        })),

      addRoute: (r) => set((state) => ({ routes: [...state.routes, r] })),
      updateRoute: (id, data) =>
        set((state) => ({
          routes: state.routes.map((r) => (r.id === id ? { ...r, ...data } : r)),
        })),
      deleteRoute: (id) =>
        set((state) => ({
          routes: state.routes.filter((r) => r.id !== id),
          vehicles: state.vehicles.map((v) => ({
            ...v,
            routeIds: v.routeIds.filter((rid) => rid !== id),
          })),
          assignments: state.assignments.filter((a) => a.routeId !== id),
        })),
      toggleRouteActive: (id) =>
        set((state) => ({
          routes: state.routes.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r)),
        })),

      addAssignment: (a) => set((state) => ({ assignments: [...state.assignments, a] })),
      updateAssignment: (id, data) =>
        set((state) => ({
          assignments: state.assignments.map((a) => (a.id === id ? { ...a, ...data } : a)),
        })),
      deleteAssignment: (id) =>
        set((state) => ({
          assignments: state.assignments.filter((a) => a.id !== id),
        })),
      toggleAssignmentActive: (id) =>
        set((state) => ({
          assignments: state.assignments.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a)),
        })),
    }),
    { name: 'edutech-transport', storage: createNamespacedStorage('edutech-transport'), version: 1 }
  )
)

registerStoreReset(() => {
  useTransportStore.setState({ vehicles: [], routes: [], assignments: [] })
})

registerStoreLoad(() => {
  const slug = sessionStorage.getItem('edutech_inst_slug')
  if (!slug) return
  try {
    const raw = localStorage.getItem(`edutech-transport_${slug}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed.state) useTransportStore.setState(parsed.state)
    }
  } catch { /* ignore */ }
})
