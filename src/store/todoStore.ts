import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getStorageKey } from '@/lib/storage'

export type TodoPriority = 'low' | 'medium' | 'high'
export type TodoStatus = 'pending' | 'in-progress' | 'completed'

export interface TodoTask {
  id: string
  title: string
  titleBn: string
  description: string
  descriptionBn: string
  dueDate: string
  priority: TodoPriority
  status: TodoStatus
  assignedTo: string[]
  createdBy: string
  createdAt: string
  completedAt?: string
}

interface TodoState {
  todos: TodoTask[]
  addTodo: (todo: TodoTask) => void
  updateTodo: (id: string, data: Partial<TodoTask>) => void
  deleteTodo: (id: string) => void
}

export const useTodoStore = create<TodoState>()(
  persist(
    (set) => ({
      todos: [],

      addTodo: (todo) =>
        set((state) => ({ todos: [...state.todos, todo] })),

      updateTodo: (id, data) =>
        set((state) => ({
          todos: state.todos.map((t) => (t.id === id ? { ...t, ...data } : t)),
        })),

      deleteTodo: (id) =>
        set((state) => ({
          todos: state.todos.filter((t) => t.id !== id),
        })),
    }),
    {
      name: getStorageKey('edutech-todos'),
      version: 1,
    }
  )
)
