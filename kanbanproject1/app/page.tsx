"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"
import LeadKanban from "@/components/project-kanban"
import ConversationPanel from "@/components/conversation-panel"
import TaskCenter from "@/components/task-center"
import Dashboard from "@/components/dashboard"
import AdminPanel from "@/components/admin-panel"
import LoginForm from "@/components/auth/login-form"
import RegisterForm from "@/components/auth/register-form"
import Image from "next/image"
import { useApiAuth } from "@/hooks/use-api-auth"
import { hasPermission } from "@/lib/permissions"
import { hasChatAccess } from "@/lib/auth"

export default function Home() {
  const [dashboardPeriod, setDashboardPeriod] = useState<"7d" | "30d" | "90d" | "1y">("30d")
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [authView, setAuthView] = useState<"login" | "register">("login")

  const { user, isAuthenticated, logout, isLoading, login, register, error } = useApiAuth()

  const isSuperAdmin = user?.role === "superadmin"

  const canAccessDashboard = hasPermission("dashboard", user)
  const canAccessPipeline = hasPermission("pipeline", user)
  const canAccessTasks = hasPermission("tarefas", user)
  const canAccessUniChat = hasPermission("unichat", user) && hasChatAccess()

  const getDefaultTab = () => {
    if (canAccessDashboard) return "dashboard"
    if (canAccessPipeline) return "leads"
    if (canAccessTasks) return "tasks"
    if (canAccessUniChat) return "conversations"
    return "dashboard"
  }

  useEffect(() => {
    const handler = (ev: ErrorEvent) => {
      const msg = ev.message || ""
      if (msg.includes("removeChild")) {
        try {
          console.error("[DOM-ERROR]", msg, ev.error && ev.error.stack ? ev.error.stack : null)
        } catch {}
      }
    }
    window.addEventListener("error", handler)
    return () => {
      window.removeEventListener("error", handler)
    }
  }, [])
  
  const handleLogout = async () => {
    await logout()
    setShowAdminPanel(false)
    setAuthView("login")
  }

  const [showForceLogout, setShowForceLogout] = useState(false)
  const [forceShowContent, setForceShowContent] = useState(false)

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isLoading) {
      timer = setTimeout(() => {
        setShowForceLogout(true)
        // Auto-resolve loading state after 2s to prevent getting stuck
        setForceShowContent(true)
      }, 2000)
    }
    return () => clearTimeout(timer)
  }, [isLoading])

  if (isLoading && !forceShowContent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 font-medium">Iniciando aplicação...</p>
          <p className="text-xs text-gray-400">Verificando credenciais</p>
        </div>
        
        {/* Debug Info */}
        {mounted && (
          <div className="text-[10px] text-gray-300 font-mono absolute bottom-4 left-4 text-left">
             Status: {isLoading ? "Loading" : "Loaded"}<br/>
             User: {user ? "Yes" : "No"}<br/>
             Token: {localStorage.getItem("unicrm_access_token") ? "Yes" : "No"}
          </div>
        )}

        <div className="flex flex-col gap-2 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
           {showForceLogout && (
             <p className="text-sm text-red-500 text-center">O carregamento está demorando.</p>
           )}
           <Button 
             variant="outline" 
             className="w-full"
             onClick={() => setForceShowContent(true)}
           >
             Entrar assim mesmo
           </Button>
           {showForceLogout && (
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={() => {
                localStorage.removeItem("unicrm_access_token")
                window.location.reload()
              }}
            >
              Reiniciar Aplicação
            </Button>
           )}
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    if (authView === "login") {
      return <LoginForm onLoginSuccess={() => setAuthView("login")} login={login} isLoading={isLoading} error={error} />
    } else {
      return <RegisterForm onRegisterSuccess={() => setAuthView("login")} register={register} isLoading={isLoading} error={error} />
    }
  }

  if (showAdminPanel && isSuperAdmin) {
    return (
      <div className="container mx-auto p-4">
        <AdminPanel onBack={() => setShowAdminPanel(false)} />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-2 md:p-4">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-4 md:mb-6 gap-3">
        <div className="flex items-center gap-3">
          <img
            src="/unicrm-logo.png"
            alt="UniCRM Logo"
            width={200}
            height={60}
            className="h-10 md:h-12 w-auto object-contain"
          />
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {isSuperAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdminPanel(true)}
              className="flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Admin</span>
            </Button>
          )}
          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
            <User className="w-3 h-3 md:w-4 md:h-4" />
            <span className="truncate max-w-[150px] md:max-w-none">{user?.email}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="flex items-center gap-1 md:gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200 bg-transparent text-xs md:text-sm"
          >
            <LogOut className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue={getDefaultTab()} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          {canAccessDashboard && (
            <TabsTrigger value="dashboard" className="text-xs md:text-sm px-2 md:px-4">
              Dashboard
            </TabsTrigger>
          )}
          {canAccessPipeline && (
            <TabsTrigger value="leads" className="text-xs md:text-sm px-2 md:px-4">
              <span className="hidden sm:inline">Pipeline de Leads</span>
              <span className="sm:hidden">Pipeline</span>
            </TabsTrigger>
          )}
          {canAccessTasks && (
            <TabsTrigger value="tasks" className="text-xs md:text-sm px-2 md:px-4">
              Tarefas
            </TabsTrigger>
          )}
          {canAccessUniChat && (
            <TabsTrigger value="conversations" className="text-xs md:text-sm px-2 md:px-4">
              WhatsApp - UniCRM
            </TabsTrigger>
          )}
        </TabsList>

        {canAccessDashboard && (
          <TabsContent value="dashboard" className="mt-2 md:mt-4">
            <Dashboard
              leads={[]}
              projects={[]}
              tasks={[]}
              funnels={[]}
              period={dashboardPeriod}
              onPeriodChange={setDashboardPeriod}
            />
          </TabsContent>
        )}

        {canAccessPipeline && (
          <TabsContent value="leads" className="mt-2 md:mt-4">
            <LeadKanban />
          </TabsContent>
        )}

        {canAccessTasks && (
          <TabsContent value="tasks" className="mt-2 md:mt-4">
            <TaskCenter
              tasks={[]}
              projects={[]}
              onUpdateTask={() => {}}
              onCreateTask={() => {}}
              onDeleteTask={() => {}}
            />
          </TabsContent>
        )}

        {canAccessUniChat && (
          <TabsContent value="conversations" className="mt-2 md:mt-4">
            <ConversationPanel />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
