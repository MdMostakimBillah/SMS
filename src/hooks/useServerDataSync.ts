import { useEffect } from 'react'
import { useTeacherStore } from '@/store/teacherStore'

/**
 * Kicks off the server-authoritative teacher/department sync (Phase 7) once a
 * server session is established. The store dedupes concurrent calls and skips
 * repeat fetches inside a short window, so it is safe to call from route
 * mounts without producing request storms.
 *
 * @param enabled true while a verified server session is active
 */
export function useServerDataSync(enabled: boolean): void {
  useEffect(() => {
    if (enabled) void useTeacherStore.getState().syncFromServer()
  }, [enabled])
}
