import { useNavigate } from 'react-router-dom'
import { CheckSquare, Users, BarChart3, ArrowRight } from 'lucide-react'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Sistema de{' '}
            <span className="text-blue-600">Gerenciamento</span>
            <br />
            de Tarefas
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Organize, acompanhe e gerencie suas tarefas de forma eficiente. 
            Colabore com sua equipe e mantenha todos os projetos em dia.
          </p>
          <button
            onClick={() => navigate('/tarefas')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 mx-auto"
          >
            <CheckSquare className="w-6 h-6" />
            Começar Agora
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <CheckSquare className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Gestão de Tarefas</h3>
            <p className="text-gray-600">
              Crie, edite e organize suas tarefas com facilidade. 
              Acompanhe o status e prioridade de cada atividade.
            </p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-200">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Colaboração</h3>
            <p className="text-gray-600">
              Atribua tarefas a membros da equipe e mantenha 
              todos informados sobre o progresso dos projetos.
            </p>
          </div>

          <div className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-200">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Relatórios</h3>
            <p className="text-gray-600">
              Visualize o histórico de alterações e mantenha 
              um registro completo de todas as atividades.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-xl p-8 shadow-lg text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Pronto para começar?
          </h2>
          <p className="text-gray-600 mb-6">
            Junte-se a milhares de equipes que já estão gerenciando 
            suas tarefas de forma mais eficiente.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/tarefas')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200"
            >
              Ver Minhas Tarefas
            </button>
            <button
              onClick={() => navigate('/tarefas/nova')}
              className="border border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-semibold transition-all duration-200"
            >
              Criar Nova Tarefa
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}