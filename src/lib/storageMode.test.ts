import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  isSuperAdminAccount,
  isLocalComputerMode,
  getActiveStorageMode,
  setLocalStorageMode,
} from './storageMode'
import { useClassStore } from '@/store/classStore'
import { useAppStore } from '@/store/appStore'

describe('storageMode isolation and super admin restrictions', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
    useClassStore.setState({
      institution: {
        ...useClassStore.getState().institution,
        storageMode: 'cloud',
      },
    })
    useAppStore.setState({
      settings: {
        ...useAppStore.getState().settings,
        storageSettings: { mode: 'cloud' },
      },
    })
  })

  afterEach(() => {
    sessionStorage.clear()
    localStorage.clear()
  })

  it('correctly detects a super admin account managing the platform', () => {
    sessionStorage.setItem('edutech_user_role', 'super_admin')
    expect(isSuperAdminAccount()).toBe(true)

    // When viewing an institution, isSuperAdminAccount returns false
    sessionStorage.setItem('edutech_viewing_id', 'inst-udvash')
    expect(isSuperAdminAccount()).toBe(false)
  })

  it('allows normal institution accounts to toggle local computer mode', () => {
    sessionStorage.setItem('edutech_user_role', 'school_admin')
    expect(isSuperAdminAccount()).toBe(false)

    setLocalStorageMode('local_computer')
    expect(sessionStorage.getItem('edutech_storage_mode')).toBe('local_computer')
    expect(isLocalComputerMode()).toBe(true)
    expect(getActiveStorageMode()).toBe('local_computer')
  })

  it('strictly prevents super admin account from switching to local computer or own VPS', () => {
    sessionStorage.setItem('edutech_user_role', 'super_admin')
    expect(isSuperAdminAccount()).toBe(true)

    // Even if local_computer is requested, it must be forced to cloud
    setLocalStorageMode('local_computer')
    expect(sessionStorage.getItem('edutech_storage_mode')).toBe('cloud')
    expect(isLocalComputerMode()).toBe(false)
    expect(getActiveStorageMode()).toBe('cloud')

    // Even if store had local_computer, super admin remains cloud
    useClassStore.setState({
      institution: {
        ...useClassStore.getState().institution,
        storageMode: 'local_computer',
      },
    })
    expect(isLocalComputerMode()).toBe(false)
    expect(getActiveStorageMode()).toBe('cloud')

    // Cannot switch to local_server either
    setLocalStorageMode('local_server')
    expect(sessionStorage.getItem('edutech_storage_mode')).toBe('cloud')
    expect(getActiveStorageMode()).toBe('cloud')
  })
})
