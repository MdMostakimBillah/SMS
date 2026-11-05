import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTransportStore } from './transportStore'
import { transportApi } from '@/lib/api'
import { normalizeVaultJsonForStore, vaultPathToKey } from '@/lib/vault/mapping'

describe('transportStore', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useTransportStore.persist?.clearStorage()
    useTransportStore.setState({
      vehicles: [],
      routes: [],
      assignments: [],
      serverSynced: false,
      syncing: false,
      syncError: null,
    })
    vi.restoreAllMocks()
  })

  it('adds and updates vehicles', () => {
    const vehicle = {
      id: 'TV-100',
      name: 'Microbus-01',
      nameBn: 'মাইক্রোবাস-০১',
      registrationNo: 'DHK-11-2233',
      capacity: 12,
      driverId: 'D-1',
      driverName: 'Abul Kalam',
      driverNameBn: 'আবুল কালাম',
      driverPhone: '01700000000',
      driverDetails: 'Valid DL',
      vehicleDetails: 'Toyota HiAce',
      routeIds: ['TR-100'],
      isActive: true,
      createdAt: '2026-11-05',
    }

    useTransportStore.getState().addVehicle(vehicle)
    expect(useTransportStore.getState().vehicles).toHaveLength(1)
    expect(useTransportStore.getState().vehicles[0].name).toBe('Microbus-01')

    useTransportStore.getState().updateVehicle('TV-100', { capacity: 14 })
    expect(useTransportStore.getState().vehicles[0].capacity).toBe(14)

    useTransportStore.getState().toggleVehicleActive('TV-100')
    expect(useTransportStore.getState().vehicles[0].isActive).toBe(false)
  })

  it('adds, updates, and deletes routes', () => {
    const route = {
      id: 'TR-100',
      name: 'Dhanmondi to School',
      nameBn: 'ধানমন্ডি থেকে স্কুল',
      stops: 'Dhanmondi-27, Kalabagan, Science Lab, School',
      stopsBn: 'ধানমন্ডি-২৭, কলাবাগান, সায়েন্স ল্যাব, স্কুল',
      distance: '6 km',
      fare: 2200,
      isActive: true,
      createdAt: '2026-11-05',
    }

    useTransportStore.getState().addRoute(route)
    expect(useTransportStore.getState().routes).toHaveLength(1)
    expect(useTransportStore.getState().routes[0].fare).toBe(2200)

    useTransportStore.getState().updateRoute('TR-100', { fare: 2500 })
    expect(useTransportStore.getState().routes[0].fare).toBe(2500)

    useTransportStore.getState().deleteRoute('TR-100')
    expect(useTransportStore.getState().routes).toHaveLength(0)
  })

  it('adds, updates, and deletes student assignments', () => {
    const assignment = {
      id: 'TA-100',
      studentId: 'ST-001',
      vehicleId: 'TV-100',
      routeId: 'TR-100',
      pickupStop: 'Kalabagan',
      monthlyFare: 2200,
      academicYear: '2026-27',
      months: [0, 1, 2, 3, 4],
      assignedDate: '2026-11-05',
      isActive: true,
    }

    useTransportStore.getState().addAssignment(assignment)
    expect(useTransportStore.getState().assignments).toHaveLength(1)
    expect(useTransportStore.getState().assignments[0].pickupStop).toBe('Kalabagan')

    useTransportStore.getState().updateAssignment('TA-100', { monthlyFare: 2400 })
    expect(useTransportStore.getState().assignments[0].monthlyFare).toBe(2400)

    useTransportStore.getState().deleteAssignment('TA-100')
    expect(useTransportStore.getState().assignments).toHaveLength(0)
  })

  it('syncs transport from backend when server has data', async () => {
    const mockData = {
      vehicles: [{ id: 'TV-1', name: 'Bus 1', nameBn: 'বাস ১', registrationNo: '123', capacity: 30, driverId: '', driverName: '', driverNameBn: '', driverPhone: '', driverDetails: '', vehicleDetails: '', routeIds: [], isActive: true, createdAt: '2026-11-05' }],
      routes: [{ id: 'TR-1', name: 'Route 1', nameBn: 'রুট ১', stops: 'A, B', stopsBn: 'ক, খ', distance: '3km', fare: 1500, isActive: true, createdAt: '2026-11-05' }],
      assignments: [{ id: 'TA-1', studentId: 'S-1', vehicleId: 'TV-1', routeId: 'TR-1', pickupStop: 'A', monthlyFare: 1500, academicYear: '2026-27', months: [0, 1], assignedDate: '2026-11-05', isActive: true }],
    }

    vi.spyOn(transportApi, 'get').mockResolvedValue(mockData)

    await useTransportStore.getState().syncFromServer('test-school')

    const state = useTransportStore.getState()
    expect(state.vehicles).toHaveLength(1)
    expect(state.vehicles[0].name).toBe('Bus 1')
    expect(state.routes).toHaveLength(1)
    expect(state.assignments).toHaveLength(1)
    expect(state.serverSynced).toBe(true)
  })

  it('correctly maps vault paths to transport key', () => {
    expect(vaultPathToKey('vehicles.json', { slug: 'demo' })).toBe('edutech-transport_demo')
    expect(vaultPathToKey('routes.json', { slug: 'demo' })).toBe('edutech-transport_demo')
    expect(vaultPathToKey('transport_assignments.json', { slug: 'demo' })).toBe('edutech-transport_demo')
    expect(vaultPathToKey('demo/transport.json', { slug: 'demo' })).toBe('edutech-transport_demo')
  })

  it('normalizes slice and aggregate vault json files into transport state', () => {
    const rawVehicles = [
      { id: 'TV-V1', name: 'Micro', registrationNo: '123', capacity: 10 },
    ]
    const normalizedV = normalizeVaultJsonForStore(
      'edutech-transport_demo',
      JSON.stringify(rawVehicles),
      'demo/vehicles.json',
    )
    const parsedV = JSON.parse(normalizedV)
    expect(parsedV.state.vehicles).toHaveLength(1)
    expect(parsedV.state.vehicles[0].name).toBe('Micro')

    const rawAggregate = {
      vehicles: [{ id: 'TV-A', name: 'Agg Bus', registrationNo: 'ABC' }],
      routes: [{ id: 'TR-A', name: 'Agg Route', stops: 'X, Y' }],
      assignments: [{ id: 'TA-A', studentId: 'S1', vehicleId: 'TV-A', routeId: 'TR-A' }],
    }
    const normalizedAgg = normalizeVaultJsonForStore(
      'edutech-transport_demo',
      JSON.stringify(rawAggregate),
      'demo/transport.json',
    )
    const parsedAgg = JSON.parse(normalizedAgg)
    expect(parsedAgg.state.vehicles).toHaveLength(1)
    expect(parsedAgg.state.routes).toHaveLength(1)
    expect(parsedAgg.state.assignments).toHaveLength(1)
  })
})
