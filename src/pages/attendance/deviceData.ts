import type { DeviceEntry, RfidEntry, FpEntry } from './types'

export const initialDevices: DeviceEntry[] = [
  {
    id: 'DEV-001',
    name: 'Main Gate RFID',
    model: 'ZKTeco SLK200',
    ip: '192.168.1.100',
    status: 'online',
    type: 'rfid',
    lastSync: new Date().toISOString(),
    staffCount: 18,
  },
  {
    id: 'DEV-002',
    name: 'Staff Room FP',
    model: 'ZKTeco K40',
    ip: '192.168.1.101',
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
    status: 'offline',
    type: 'face',
    lastSync: '',
    staffCount: 12,
  },
  {
    id: 'DEV-004',
    name: 'Back Gate Multi',
    model: 'ZKTeco MB10',
    ip: '192.168.1.103',
    status: 'online',
    type: 'multi',
    lastSync: new Date().toISOString(),
    staffCount: 20,
  },
]

export const initialRfidEntries: RfidEntry[] = [
  { staffId: 'TCH-2026-001', staffName: 'Dr. Rafiqul Islam', rfidCard: 'CARD-1000', type: 'Admin', assigned: true },
  { staffId: 'TCH-2026-002', staffName: 'Prof. Salma Khatun', rfidCard: 'CARD-1001', type: 'Faculty', assigned: true },
  { staffId: 'TCH-2026-003', staffName: 'Md. Habibur Rahman', rfidCard: 'CARD-1002', type: 'Faculty', assigned: true },
  { staffId: 'TCH-2026-004', staffName: 'Farhana Rahman', rfidCard: 'CARD-1003', type: 'Staff', assigned: true },
  { staffId: 'TCH-2026-005', staffName: 'Abdul Karim', rfidCard: 'CARD-1004', type: 'Faculty', assigned: true },
  { staffId: 'TCH-2026-006', staffName: 'Nasreen Akhter', rfidCard: 'CARD-1005', type: 'Staff', assigned: true },
  { staffId: 'TCH-2026-008', staffName: 'Mohammad Ali', rfidCard: 'CARD-1006', type: 'Faculty', assigned: true },
  { staffId: 'TCH-2026-009', staffName: 'Roksana Begum', rfidCard: 'CARD-1007', type: 'Staff', assigned: true },
  { staffId: 'TCH-2026-010', staffName: 'Kamal Hossain', rfidCard: 'CARD-1008', type: 'Faculty', assigned: true },
  { staffId: 'TCH-2026-011', staffName: 'Shirin Sultana', rfidCard: 'CARD-1009', type: 'Staff', assigned: true },
  { staffId: 'TCH-2026-012', staffName: 'Tanvir Ahmed', rfidCard: 'CARD-1010', type: 'Faculty', assigned: true },
  { staffId: 'TCH-2026-014', staffName: 'Sabrina Haque', rfidCard: 'CARD-1011', type: 'Admin', assigned: true },
]

export const initialFpEntries: FpEntry[] = [
  { staffId: 'TCH-2026-001', staffName: 'Dr. Rafiqul Islam', fpId: 1, templates: 2, status: 'enrolled' },
  { staffId: 'TCH-2026-002', staffName: 'Prof. Salma Khatun', fpId: 2, templates: 2, status: 'enrolled' },
  { staffId: 'TCH-2026-003', staffName: 'Md. Habibur Rahman', fpId: 3, templates: 1, status: 'enrolled' },
  { staffId: 'TCH-2026-004', staffName: 'Farhana Rahman', fpId: 4, templates: 2, status: 'enrolled' },
  { staffId: 'TCH-2026-005', staffName: 'Abdul Karim', fpId: 5, templates: 1, status: 'enrolled' },
  { staffId: 'TCH-2026-006', staffName: 'Nasreen Akhter', fpId: 6, templates: 2, status: 'enrolled' },
  { staffId: 'TCH-2026-008', staffName: 'Mohammad Ali', fpId: 7, templates: 1, status: 'enrolled' },
  { staffId: 'TCH-2026-009', staffName: 'Roksana Begum', fpId: 8, templates: 2, status: 'enrolled' },
  { staffId: 'TCH-2026-010', staffName: 'Kamal Hossain', fpId: 9, templates: 0, status: 'pending' },
  { staffId: 'TCH-2026-011', staffName: 'Shirin Sultana', fpId: 10, templates: 0, status: 'failed' },
]
