import { create } from 'zustand'
import { Task, TaskFilters, Attachment, HistoryEntry } from '@/types/task'

interface TaskStore {
  tasks: Task[]
  currentTask: Task | null
  attachments: Attachment[]
  history: HistoryEntry[]
  filters: TaskFilters
  loading: boolean
  error: string | null
  
  // Actions
  setTasks: (tasks: Task[]) => void
  setCurrentTask: (task: Task | null) => void
  setAttachments: (attachments: Attachment[]) => void
  setHistory: (history: HistoryEntry[]) => void
  setFilters: (filters: TaskFilters) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  addTask: (task: Task) => void
  updateTask: (task: Task) => void
  deleteTask: (taskId: string) => void
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  currentTask: null,
  attachments: [],
  history: [],
  filters: {},
  loading: false,
  error: null,
  
  setTasks: (tasks) => set({ tasks }),
  setCurrentTask: (currentTask) => set({ currentTask }),
  setAttachments: (attachments) => set({ attachments }),
  setHistory: (history) => set({ history }),
  setFilters: (filters) => set({ filters }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  addTask: (task) => set((state) => ({ 
    tasks: [...state.tasks, task] 
  })),
  
  updateTask: (task) => set((state) => ({
    tasks: state.tasks.map(t => t.id === task.id ? task : t),
    currentTask: state.currentTask?.id === task.id ? task : state.currentTask
  })),
  
  deleteTask: (taskId) => set((state) => ({
    tasks: state.tasks.filter(t => t.id !== taskId),
    currentTask: state.currentTask?.id === taskId ? null : state.currentTask
  }))
}))