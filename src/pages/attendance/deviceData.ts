import type { DeviceEntry, RfidEntry, FpEntry, FaceEntry } from './types'

export const initialDevices: DeviceEntry[] = [
  {
    id: 'DEV-001',
    name: 'Main Gate RFID',
    model: 'ZKTeco SLK200',
    ip: '192.168.1.100',
    port: 4370,
    location: 'Main Gate',
    status: 'online',
    type: 'rfid',
    lastSync: new Date().toISOString(),
    staffCount: 24,
  },
  {
    id: 'DEV-002',
    name: 'Staff Room FP',
    model: 'ZKTeco K40',
    ip: '192.168.1.101',
    port: 4370,
    location: 'Teachers Lounge',
    status: 'online',
    type: 'fingerprint',
    lastSync: new Date().toISOString(),
    staffCount: 15,
  },
  {
    id: 'DEV-003',
    name: 'Admin Block Face',
    model: 'Hikvision DS-K1T344',
    ip: '192.168.1.102',
    port: 8000,
    location: 'Administration Building',
    status: 'online',
    type: 'face',
    lastSync: new Date().toISOString(),
    staffCount: 18,
  },
  {
    id: 'DEV-004',
    name: 'Student Gate Face Terminal',
    model: 'Hikvision DS-K1T673',
    ip: '192.168.1.103',
    port: 8000,
    location: 'Student Entrance',
    status: 'online',
    type: 'face',
    lastSync: new Date().toISOString(),
    staffCount: 30,
  },
  {
    id: 'DEV-005',
    name: 'Back Gate Multi',
    model: 'ZKTeco MB10',
    ip: '192.168.1.104',
    port: 4370,
    location: 'West Gate',
    status: 'online',
    type: 'multi',
    lastSync: new Date().toISOString(),
    staffCount: 20,
  },
  {
    id: 'DEV-006',
    name: 'Time Clock Terminal',
    model: 'ZKTeco K14 Pro Punch',
    ip: '192.168.1.105',
    port: 4370,
    location: 'Staff Reception',
    status: 'online',
    type: 'punch',
    lastSync: new Date().toISOString(),
    staffCount: 25,
  },
]

export const initialRfidEntries: RfidEntry[] = [
  // Students
  { staffId: 'STU-2026-001', staffName: 'Arafat Rahman', rfidCard: 'CARD-2001', type: 'Student', assigned: true },
  { staffId: 'STU-2026-002', staffName: 'Sumaiya Akter', rfidCard: 'CARD-2002', type: 'Student', assigned: true },
  { staffId: 'STU-2026-003', staffName: 'Tanvir Hasan', rfidCard: 'CARD-2003', type: 'Student', assigned: true },
  { staffId: 'STU-2026-004', staffName: 'Nusrat Jahan', rfidCard: 'CARD-2004', type: 'Student', assigned: true },
  { staffId: 'STU-2026-005', staffName: 'Mahmudul Hasan', rfidCard: 'CARD-2005', type: 'Student', assigned: true },
  // Faculty & Staff
  { staffId: 'TCH-2026-001', staffName: 'Dr. Rafiqul Islam', rfidCard: 'CARD-1000', type: 'Admin', assigned: true },
  { staffId: 'TCH-2026-002', staffName: 'Prof. Salma Khatun', rfidCard: 'CARD-1001', type: 'Faculty', assigned: true },
  { staffId: 'TCH-2026-003', staffName: 'Md. Habibur Rahman', rfidCard: 'CARD-1002', type: 'Faculty', assigned: true },
  { staffId: 'TCH-2026-004', staffName: 'Farhana Rahman', rfidCard: 'CARD-1003', type: 'Staff', assigned: true },
  { staffId: 'TCH-2026-005', staffName: 'Abdul Karim', rfidCard: 'CARD-1004', type: 'Faculty', assigned: true },
  { staffId: 'TCH-2026-006', staffName: 'Nasreen Akhter', rfidCard: 'CARD-1005', type: 'Staff', assigned: true },
  { staffId: 'TCH-2026-008', staffName: 'Mohammad Ali', rfidCard: 'CARD-1006', type: 'Faculty', assigned: true },
]

export const initialFpEntries: FpEntry[] = [
  // Students
  { staffId: 'STU-2026-001', staffName: 'Arafat Rahman', fpId: 1, templates: 2, status: 'enrolled' },
  { staffId: 'STU-2026-002', staffName: 'Sumaiya Akter', fpId: 2, templates: 2, status: 'enrolled' },
  { staffId: 'STU-2026-003', staffName: 'Tanvir Hasan', fpId: 3, templates: 1, status: 'enrolled' },
  { staffId: 'STU-2026-004', staffName: 'Nusrat Jahan', fpId: 4, templates: 2, status: 'enrolled' },
  // Faculty & Staff
  { staffId: 'TCH-2026-001', staffName: 'Dr. Rafiqul Islam', fpId: 5, templates: 2, status: 'enrolled' },
  { staffId: 'TCH-2026-002', staffName: 'Prof. Salma Khatun', fpId: 6, templates: 2, status: 'enrolled' },
  { staffId: 'TCH-2026-003', staffName: 'Md. Habibur Rahman', fpId: 7, templates: 1, status: 'enrolled' },
  { staffId: 'TCH-2026-004', staffName: 'Farhana Rahman', fpId: 8, templates: 2, status: 'enrolled' },
  { staffId: 'TCH-2026-005', staffName: 'Abdul Karim', fpId: 9, templates: 1, status: 'enrolled' },
  { staffId: 'TCH-2026-006', staffName: 'Nasreen Akhter', fpId: 10, templates: 2, status: 'enrolled' },
]

export const initialFaceEntries: FaceEntry[] = [
  // Students
  { staffId: 'STU-2026-001', staffName: 'Arafat Rahman', faceId: 1, quality: 97, status: 'enrolled' },
  { staffId: 'STU-2026-002', staffName: 'Sumaiya Akter', faceId: 2, quality: 95, status: 'enrolled' },
  { staffId: 'STU-2026-003', staffName: 'Tanvir Hasan', faceId: 3, quality: 92, status: 'enrolled' },
  { staffId: 'STU-2026-004', staffName: 'Nusrat Jahan', faceId: 4, quality: 96, status: 'enrolled' },
  // Faculty & Staff
  { staffId: 'TCH-2026-001', staffName: 'Dr. Rafiqul Islam', faceId: 5, quality: 98, status: 'enrolled' },
  { staffId: 'TCH-2026-002', staffName: 'Prof. Salma Khatun', faceId: 6, quality: 94, status: 'enrolled' },
  { staffId: 'TCH-2026-003', staffName: 'Md. Habibur Rahman', faceId: 7, quality: 91, status: 'enrolled' },
  { staffId: 'TCH-2026-004', staffName: 'Farhana Rahman', faceId: 8, quality: 96, status: 'enrolled' },
]
