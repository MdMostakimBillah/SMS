import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { teachersApi, type TeacherData } from '@/lib/api'

const TEACHERS_KEY = ['teachers'] as const

export function useTeachers() {
  return useQuery({
    queryKey: TEACHERS_KEY,
    queryFn: teachersApi.list,
  })
}

export function useTeacher(id: string) {
  return useQuery({
    queryKey: [...TEACHERS_KEY, id],
    queryFn: () => teachersApi.get(id),
    enabled: !!id,
  })
}

export function useCreateTeacher() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<TeacherData>) => teachersApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: TEACHERS_KEY }),
  })
}

export function useUpdateTeacher() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TeacherData> }) =>
      teachersApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: TEACHERS_KEY }),
  })
}

export function useDeleteTeacher() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => teachersApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: TEACHERS_KEY }),
  })
}
