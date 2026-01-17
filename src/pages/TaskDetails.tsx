import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Edit, Download, Clock, User, Calendar, AlertCircle, CheckCircle, Circle, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { useTaskStore } from '@/store/taskStore'
import { getTaskById, getTaskHistory, getTaskAttachments } from '@/api/tasks'
import { TaskStatus, TaskPriority } from '@/types/task'

export default function TaskDetails() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { currentTask, setCurrentTask } = useTaskStore()
  
  const [history, setHistory] = useState([])
  const [attachments, setAttachments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadTaskDetails()
    }
  }, [id])

  const loadTaskDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [taskData, historyData, attachmentsData] = await Promise.all([
        getTaskById(id!),
        getTaskHistory(id!),
        getTaskAttachments(id!)
      ])
      
      setCurrentTask(taskData)
      setHistory(historyData)
      setAttachments(attachmentsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar detalhes da tarefa')
    } finally {
      setLoading(false)
    }
  }

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case 'alta': return 'text-red-600 bg-red-100'
      case 'media': return 'text-yellow-600 bg-yellow-100'
      case 'baixa': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'pendente': return <Circle className="w-5 h-5 text-gray-500" />
      case 'em_andamento': return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case 'concluida': return <CheckCircle className="w-5 h-5 text-green-500" />
      default: return <Circle className="w-5 h-5 text-gray-500" />
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

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    try {
      if (link.parentNode) {
        link.parentNode.removeChild(link)
      }
    } catch {}
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando detalhes da tarefa...</p>
        </div>
      </div>
    )
  }

  if (error || !currentTask) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar tarefa</h3>
          <p className="text-gray-600 mb-4">{error || 'Tarefa não encontrada'}</p>
          <button
            onClick={() => navigate('/tarefas')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            Voltar para lista
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/tarefas')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Detalhes da Tarefa</h1>
              <p className="text-gray-600">Visualize e gerencie os detalhes da tarefa</p>
            </div>
          </div>
          
          <button
            onClick={() => navigate(`/tarefas/${id}/editar`)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow"
          >
            <Edit className="w-4 h-4" />
            Editar
          </button>
        </div>

        {/* Task Info */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{currentTask.titulo}</h2>
              {currentTask.descricao && (
                <p className="text-gray-600 mb-4">{currentTask.descricao}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(currentTask.status)}
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(currentTask.status)}`}>
                {currentTask.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 text-gray-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Criador</p>
                <p className="font-medium">{currentTask.criador?.nome || 'Não informado'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-5 h-5 text-gray-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Responsável</p>
                <p className="font-medium">{currentTask.responsavel?.nome || 'Não informado'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-5 h-5 text-gray-400">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Prioridade</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(currentTask.prioridade)}`}>
                  {currentTask.prioridade}
                </span>
              </div>
            </div>

            {currentTask.data_vencimento && (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 text-gray-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vencimento</p>
                  <p className="font-medium">{format(new Date(currentTask.data_vencimento), 'dd/MM/yyyy')}</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Criada em: {format(new Date(currentTask.created_at), 'dd/MM/yyyy HH:mm')}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Atualizada em: {format(new Date(currentTask.updated_at), 'dd/MM/yyyy HH:mm')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Anexos</h3>
            <div className="space-y-3">
              {attachments.map((attachment) => (
                <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="font-medium text-sm">{attachment.nome_arquivo}</p>
                      <p className="text-xs text-gray-600">
                        {attachment.tipo_arquivo} • {format(new Date(attachment.created_at), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownload(attachment.url_arquivo, attachment.nome_arquivo)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Alterações</h3>
            <div className="space-y-4">
              {history.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 pb-4 border-b last:border-b-0 last:pb-0">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{entry.usuario?.nome || 'Sistema'}</span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">
                      Alterou <span className="font-medium">{entry.campo_alterado}</span>
                      {entry.valor_anterior && (
                        <span className="text-gray-500"> de "{entry.valor_anterior}"</span>
                      )}
                      {entry.valor_novo && (
                        <span> para "{entry.valor_novo}"</span>
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
