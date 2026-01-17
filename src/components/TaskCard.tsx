import { Task, TaskStatus, TaskPriority } from '@/types/task'
import { 
  Clock, 
  User, 
  AlertCircle, 
  CheckCircle, 
  Circle, 
  MoreVertical,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'
import { format } from 'date-fns'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface TaskCardProps {
  task: Task
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void
  onDelete: (taskId: string) => void
}

export default function TaskCard({ task, onStatusChange, onDelete }: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const navigate = useNavigate()

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'alta': return 'border-l-red-500 bg-red-50'
      case 'media': return 'border-l-yellow-500 bg-yellow-50'
      case 'baixa': return 'border-l-green-500 bg-green-50'
      default: return 'border-l-gray-500 bg-gray-50'
    }
  }

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'pendente': return <Circle className="w-4 h-4 text-gray-500" />
      case 'em_andamento': return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case 'concluida': return <CheckCircle className="w-4 h-4 text-green-500" />
      default: return <Circle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadgeColor = (status: TaskStatus) => {
    switch (status) {
      case 'pendente': return 'bg-gray-100 text-gray-800'
      case 'em_andamento': return 'bg-yellow-100 text-yellow-800'
      case 'concluida': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleStatusChange = (newStatus: TaskStatus) => {
    onStatusChange(task.id, newStatus)
    setShowMenu(false)
  }

  const handleDelete = () => {
    if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
      onDelete(task.id)
    }
    setShowMenu(false)
  }

  return (
    <div className={`relative rounded-lg border-l-4 p-4 shadow-sm hover:shadow-md transition-shadow ${getPriorityColor(task.prioridade)}`}>
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-gray-900 text-sm">{task.titulo}</h3>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-8 bg-white border rounded-lg shadow-lg z-10 min-w-32">
              <button
                onClick={() => navigate(`/tarefas/${task.id}`)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Eye className="w-3 h-3" /> Ver detalhes
              </button>
              <button
                onClick={() => navigate(`/tarefas/${task.id}/editar`)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Edit className="w-3 h-3" /> Editar
              </button>
              <div className="border-t my-1"></div>
              <button
                onClick={() => handleStatusChange('pendente')}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Circle className="w-3 h-3" /> Marcar pendente
              </button>
              <button
                onClick={() => handleStatusChange('em_andamento')}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <AlertCircle className="w-3 h-3" /> Marcar em andamento
              </button>
              <button
                onClick={() => handleStatusChange('concluida')}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <CheckCircle className="w-3 h-3" /> Marcar concluída
              </button>
              <div className="border-t my-1"></div>
              <button
                onClick={handleDelete}
                className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
              >
                <Trash2 className="w-3 h-3" /> Excluir
              </button>
            </div>
          )}
        </div>
      </div>

      {task.descricao && (
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{task.descricao}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
        <div className="flex items-center gap-1">
          {getStatusIcon(task.status)}
          <span className={`px-2 py-1 rounded-full ${getStatusBadgeColor(task.status)}`}>
            {task.status.replace('_', ' ')}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <User className="w-3 h-3" />
          <span>{task.responsavel?.nome || 'Não atribuído'}</span>
        </div>
      </div>

      {task.data_vencimento && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Clock className="w-3 h-3" />
          <span>Vence em: {format(new Date(task.data_vencimento), 'dd/MM/yyyy')}</span>
        </div>
      )}
    </div>
  )
}