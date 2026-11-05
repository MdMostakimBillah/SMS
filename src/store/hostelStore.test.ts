import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useHostelStore } from './hostelStore'
import { hostelApi } from '@/lib/api'
import { normalizeVaultJsonForStore, vaultPathToKey } from '@/lib/vault/mapping'

describe('hostelStore', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useHostelStore.persist?.clearStorage()
    useHostelStore.setState({
      rooms: [],
      assignments: [],
      serverSynced: false,
      syncing: false,
      syncError: null,
    })
    vi.restoreAllMocks()
  })

  it('adds and updates rooms', () => {
    const room = {
      id: 'HR-100',
      name: 'Executive Suite 101',
      nameBn: 'এক্সিকিউটিভ স্যুট ১০১',
      roomNumber: 'ES-101',
      floor: '1st Floor',
      capacity: 3,
      monthlyRent: 6000,
      amenities: 'AC, WiFi, Study Table',
      amenitiesBn: 'এসি, ওয়াইফাই, পড়ার টেবিল',
      isActive: true,
      createdAt: '2026-11-05',
    }

    useHostelStore.getState().addRoom(room)
    expect(useHostelStore.getState().rooms).toHaveLength(1)
    expect(useHostelStore.getState().rooms[0].name).toBe('Executive Suite 101')

    useHostelStore.getState().updateRoom('HR-100', { monthlyRent: 6500 })
    expect(useHostelStore.getState().rooms[0].monthlyRent).toBe(6500)

    useHostelStore.getState().toggleRoomActive('HR-100')
    expect(useHostelStore.getState().rooms[0].isActive).toBe(false)
  })

  it('adds, updates, and deletes student room assignments', () => {
    const assignment = {
      id: 'HA-100',
      studentId: 'ST-002',
      roomId: 'HR-100',
      bedNumber: 'A',
      monthlyRent: 6000,
      academicYear: '2026-27',
      months: [0, 1, 2],
      assignedDate: '2026-11-05',
      isActive: true,
    }

    useHostelStore.getState().addAssignment(assignment)
    expect(useHostelStore.getState().assignments).toHaveLength(1)
    expect(useHostelStore.getState().assignments[0].bedNumber).toBe('A')

    useHostelStore.getState().updateAssignment('HA-100', { monthlyRent: 6200 })
    expect(useHostelStore.getState().assignments[0].monthlyRent).toBe(6200)

    useHostelStore.getState().deleteAssignment('HA-100')
    expect(useHostelStore.getState().assignments).toHaveLength(0)
  })

  it('syncs hostel from backend when server has data', async () => {
    const mockData = {
      rooms: [{ id: 'HR-1', name: 'Room 1', nameBn: 'রুম ১', roomNumber: '101', floor: '1st', capacity: 4, monthlyRent: 4000, amenities: '', amenitiesBn: '', isActive: true, createdAt: '2026-11-05' }],
      assignments: [{ id: 'HA-1', studentId: 'S-1', roomId: 'HR-1', bedNumber: '1', monthlyRent: 4000, academicYear: '2026-27', months: [0, 1], assignedDate: '2026-11-05', isActive: true }],
    }

    vi.spyOn(hostelApi, 'get').mockResolvedValue(mockData)

    await useHostelStore.getState().syncFromServer('test-school')

    const state = useHostelStore.getState()
    expect(state.rooms).toHaveLength(1)
    expect(state.rooms[0].roomNumber).toBe('101')
    expect(state.assignments).toHaveLength(1)
    expect(state.serverSynced).toBe(true)
  })

  it('correctly maps vault paths to hostel key', () => {
    expect(vaultPathToKey('rooms.json', { slug: 'demo' })).toBe('edutech-hostel_demo')
    expect(vaultPathToKey('hostel_assignments.json', { slug: 'demo' })).toBe('edutech-hostel_demo')
    expect(vaultPathToKey('demo/hostel.json', { slug: 'demo' })).toBe('edutech-hostel_demo')
  })

  it('normalizes slice and aggregate vault json files into hostel state', () => {
    const rawRooms = [
      { id: 'HR-R1', name: 'Deluxe', roomNumber: 'D-1', capacity: 2, monthlyRent: 7000 },
    ]
    const normalizedR = normalizeVaultJsonForStore(
      'edutech-hostel_demo',
      JSON.stringify(rawRooms),
      'demo/rooms.json',
    )
    const parsedR = JSON.parse(normalizedR)
    expect(parsedR.state.rooms).toHaveLength(1)
    expect(parsedR.state.rooms[0].name).toBe('Deluxe')

    const rawAggregate = {
      rooms: [{ id: 'HR-A', name: 'Agg Room', roomNumber: 'A-1' }],
      assignments: [{ id: 'HA-A', studentId: 'S1', roomId: 'HR-A', bedNumber: '1' }],
    }
    const normalizedAgg = normalizeVaultJsonForStore(
      'edutech-hostel_demo',
      JSON.stringify(rawAggregate),
      'demo/hostel.json',
    )
    const parsedAgg = JSON.parse(normalizedAgg)
    expect(parsedAgg.state.rooms).toHaveLength(1)
    expect(parsedAgg.state.assignments).toHaveLength(1)
  })
})
