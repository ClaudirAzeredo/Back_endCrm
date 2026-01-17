import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, AlertCircle, Loader2 } from 'lucide-react'
import TaskCard from '@/components/TaskCard'
import TaskFilters from '@/components/TaskFilters'
import { useTaskStore } from '@/store/taskStore'
import { getTasks, updateTask, deleteTask } from '@/api/tasks'
import { TaskStatus } from '@/types/task'

export default function TaskList() {
  const navigate = useNavigate()
  const { tasks, filters, loading, error, setTasks, setFilters, setLoading, setError } = useTaskStore()
  
  useEffect(() => {
    loadTasks()
  }, [filters])

  const loadTasks = async () => {
    try {
      setLoading(true)
      setError(null)
      const tasksData = await getTasks(filters)
      setTasks(tasksData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar tarefas')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateTask(taskId, { status: newStatus })
      await loadTasks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar status')
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId)
      await loadTasks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir tarefa')
    }
  }

  const handleFiltersChange = (newFilters: { status?: TaskStatus; prioridade?: TaskPriority; responsavel?: string; data_vencimento?: string }) => {
    setFilters(newFilters)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tarefas</h1>
            <p className="text-gray-600 mt-1">Gerencie suas tarefas e acompanhe o progresso</p>
          </div>
          
          <button
            onClick={() => navigate('/tarefas/nova')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow"
          >
            <Plus className="w-4 h-4" />
            Nova Tarefa
          </button>
        </div>

        {/* Filters */}
        <TaskFilters filters={filters} onFiltersChange={handleFiltersChange} />

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* Tasks Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onDelete={handleDeleteTask}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && tasks.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma tarefa encontrada</h3>
            <p className="text-gray-600 mb-4">
              {Object.keys(filters).some(key => filters[key as keyof typeof filters]) 
                ? 'Tente ajustar os filtros ou' 
                : 'Comece criando sua primeira tarefa'}
            </p>
            <button
              onClick={() => navigate('/tarefas/nova')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Criar Tarefa
            </button>
          </div>
        )}
      </div>
    </div>
  )
}