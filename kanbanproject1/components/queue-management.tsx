"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Users,
  Plus,
  Settings,
  MoreVertical,
  User,
  Power,
  PowerOff,
  UserPlus,
  Trash2,
  ArrowUpDown,
  Shuffle,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { loadFromStorage } from "@/lib/storage"

interface Queue {
  id: string
  name: string
  description: string
  color: string
  department: string
  members: any[]
  status: "active" | "inactive"
  createdAt: string
  queueType: "free_access" | "ordered_distribution"
  distributionOrder?: string[] // Array of user IDs in order
  currentIndex?: number // Current position in the distribution cycle
}

const systemUsers: any[] = []

const initialQueues: Queue[] = []

export default function QueueManagement() {
  const [queues, setQueues] = useState<Queue[]>(initialQueues)
  const [isCreateQueueOpen, setIsCreateQueueOpen] = useState(false)
  const [isManageMembersOpen, setIsManageMembersOpen] = useState(false)
  const [selectedQueueForMembers, setSelectedQueueForMembers] = useState<Queue | null>(null)
  const [systemUsers, setSystemUsers] = useState<any[]>([])
  const [newQueue, setNewQueue] = useState({
    name: "",
    description: "",
    color: "bg-teal-500",
    department: "",
    queueType: "free_access" as "free_access" | "ordered_distribution",
  })

  useEffect(() => {
    const loadUsers = () => {
      const storedUsers = loadFromStorage("users", [])
      // Filter only active users for queue assignment
      const activeUsers = Array.isArray(storedUsers) ? storedUsers.filter((user) => user.status === "active") : []
      setSystemUsers(activeUsers)
    }

    loadUsers()

    // Listen for storage changes to update users list
    const handleStorageChange = () => {
      loadUsers()
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  const handleCreateQueue = () => {
    const queue: Queue = {
      id: Date.now().toString(),
      ...newQueue,
      members: [],
      status: "active",
      createdAt: new Date().toISOString(),
      distributionOrder: [],
      currentIndex: 0,
    }
    setQueues([...queues, queue])
    setNewQueue({ name: "", description: "", color: "bg-teal-500", department: "", queueType: "free_access" })
    setIsCreateQueueOpen(false)
  }

  const toggleQueueStatus = (queueId: string) => {
    setQueues(
      queues.map((q) => (q.id === queueId ? { ...q, status: q.status === "active" ? "inactive" : "active" } : q)),
    )
  }

  const addMemberToQueue = (queueId: string, user: any) => {
    setQueues(
      queues.map((q) => {
        if (q.id === queueId) {
          const updatedMembers = [...q.members.filter((m) => m.id !== user.id), user]
          const updatedDistributionOrder =
            q.queueType === "ordered_distribution"
              ? [...(q.distributionOrder || []).filter((id) => id !== user.id), user.id]
              : q.distributionOrder

          return {
            ...q,
            members: updatedMembers,
            distributionOrder: updatedDistributionOrder,
          }
        }
        return q
      }),
    )
  }

  const removeMemberFromQueue = (queueId: string, userId: string) => {
    setQueues(
      queues.map((q) => {
        if (q.id === queueId) {
          const updatedMembers = q.members.filter((m) => m.id !== userId)
          const updatedDistributionOrder = q.distributionOrder?.filter((id) => id !== userId) || []
          const updatedCurrentIndex =
            q.currentIndex && q.currentIndex >= updatedDistributionOrder.length ? 0 : q.currentIndex

          return {
            ...q,
            members: updatedMembers,
            distributionOrder: updatedDistributionOrder,
            currentIndex: updatedCurrentIndex,
          }
        }
        return q
      }),
    )
  }

  const getNextUserInQueue = (queueId: string) => {
    const queue = queues.find((q) => q.id === queueId)
    if (!queue || queue.queueType !== "ordered_distribution" || !queue.distributionOrder?.length) {
      return null
    }

    const currentIndex = queue.currentIndex || 0
    const nextUserId = queue.distributionOrder[currentIndex]
    const nextUser = queue.members.find((m) => m.id === nextUserId)

    // Update the current index for next assignment
    const nextIndex = (currentIndex + 1) % queue.distributionOrder.length
    setQueues(queues.map((q) => (q.id === queueId ? { ...q, currentIndex: nextIndex } : q)))

    return nextUser
  }

  const reorderDistribution = (queueId: string, newOrder: string[]) => {
    setQueues(queues.map((q) => (q.id === queueId ? { ...q, distributionOrder: newOrder, currentIndex: 0 } : q)))
  }

  const openMembersDialog = (queue: Queue) => {
    setSelectedQueueForMembers(queue)
    setIsManageMembersOpen(true)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "manager":
        return "bg-teal-100 text-teal-800 border-teal-200"
      case "employee":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "Admin"
      case "manager":
        return "Gerente"
      case "employee":
        return "Funcionário"
      default:
        return "Usuário"
    }
  }

  const getQueueTypeInfo = (queueType: "free_access" | "ordered_distribution") => {
    switch (queueType) {
      case "free_access":
        return {
          label: "Acesso Livre",
          description: "Todos podem pegar qualquer atendimento",
          icon: <Shuffle className="h-4 w-4" />,
          color: "bg-green-100 text-green-800",
        }
      case "ordered_distribution":
        return {
          label: "Distribuição Ordenada",
          description: "Atendimentos distribuídos sequencialmente",
          icon: <ArrowUpDown className="h-4 w-4" />,
          color: "bg-teal-100 text-teal-800",
        }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Filas</h1>
          <p className="text-muted-foreground">
            Organize sua equipe em filas departamentais para melhor distribuição de trabalho
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateQueueOpen} onOpenChange={setIsCreateQueueOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Fila
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Criar Nova Fila Departamental</DialogTitle>
                <DialogDescription>
                  Configure uma nova fila para organizar sua equipe por departamento
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome da Fila</Label>
                  <Input
                    id="name"
                    value={newQueue.name}
                    onChange={(e) => setNewQueue({ ...newQueue, name: e.target.value })}
                    placeholder="Ex: Suporte, Financeiro, Prospecção"
                  />
                </div>
                <div>
                  <Label htmlFor="department">Departamento</Label>
                  <Input
                    id="department"
                    value={newQueue.department}
                    onChange={(e) => setNewQueue({ ...newQueue, department: e.target.value })}
                    placeholder="Ex: Atendimento ao Cliente, Vendas, Pós-vendas"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={newQueue.description}
                    onChange={(e) => setNewQueue({ ...newQueue, description: e.target.value })}
                    placeholder="Descreva as responsabilidades desta fila"
                  />
                </div>

                <div>
                  <Label>Tipo de Funcionamento</Label>
                  <RadioGroup
                    value={newQueue.queueType}
                    onValueChange={(value: "free_access" | "ordered_distribution") =>
                      setNewQueue({ ...newQueue, queueType: value })
                    }
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="free_access" id="free_access" />
                      <div className="flex-1">
                        <Label htmlFor="free_access" className="font-medium cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Shuffle className="h-4 w-4" />
                            Acesso Livre
                          </div>
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Todos os usuários podem visualizar e assumir qualquer atendimento disponível
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 p-3 border rounded-lg">
                      <RadioGroupItem value="ordered_distribution" id="ordered_distribution" />
                      <div className="flex-1">
                        <Label htmlFor="ordered_distribution" className="font-medium cursor-pointer">
                          <div className="flex items-center gap-2">
                            <ArrowUpDown className="h-4 w-4" />
                            Distribuição Ordenada
                          </div>
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">
                          Atendimentos são distribuídos automaticamente seguindo uma ordem fixa de usuários
                        </p>
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="color">Cor</Label>
                  <Select value={newQueue.color} onValueChange={(value) => setNewQueue({ ...newQueue, color: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bg-teal-500">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-teal-500" />
                          Teal
                        </div>
                      </SelectItem>
                      <SelectItem value="bg-green-500">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-green-500" />
                          Verde
                        </div>
                      </SelectItem>
                      <SelectItem value="bg-purple-500">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-purple-500" />
                          Roxo
                        </div>
                      </SelectItem>
                      <SelectItem value="bg-red-500">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-red-500" />
                          Vermelho
                        </div>
                      </SelectItem>
                      <SelectItem value="bg-orange-500">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-orange-500" />
                          Laranja
                        </div>
                      </SelectItem>
                      <SelectItem value="bg-blue-500">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-blue-500" />
                          Azul
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateQueueOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateQueue} disabled={!newQueue.name || !newQueue.department}>
                  Criar Fila
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Queue Overview Cards */}
      {queues.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma fila criada</h3>
            <p className="text-muted-foreground text-center mb-6">
              Comece criando filas departamentais para organizar sua equipe por áreas de atuação.
            </p>
            <Dialog open={isCreateQueueOpen} onOpenChange={setIsCreateQueueOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Fila
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {queues.map((queue) => {
            const queueTypeInfo = getQueueTypeInfo(queue.queueType)

            return (
              <Card
                key={queue.id}
                className={`relative overflow-hidden ${queue.status === "inactive" ? "opacity-60" : ""}`}
              >
                <div className={`absolute top-0 left-0 w-full h-1 ${queue.color}`} />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${queue.color}`} />
                      <CardTitle className="text-lg">{queue.name}</CardTitle>
                      {queue.status === "inactive" && (
                        <Badge variant="secondary" className="text-xs">
                          Inativa
                        </Badge>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Settings className="h-4 w-4 mr-2" />
                          Configurar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openMembersDialog(queue)}>
                          <Users className="h-4 w-4 mr-2" />
                          Gerenciar Membros
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleQueueStatus(queue.id)}>
                          {queue.status === "active" ? (
                            <>
                              <PowerOff className="h-4 w-4 mr-2" />
                              Desativar Fila
                            </>
                          ) : (
                            <>
                              <Power className="h-4 w-4 mr-2" />
                              Ativar Fila
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription className="text-sm">{queue.description}</CardDescription>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="w-fit text-xs">
                      {queue.department}
                    </Badge>
                    <Badge variant="outline" className={`w-fit text-xs ${queueTypeInfo.color}`}>
                      <div className="flex items-center gap-1">
                        {queueTypeInfo.icon}
                        {queueTypeInfo.label}
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{queue.members.length} membros</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{queue.members.filter((m) => m.role === "supervisor").length} supervisores</span>
                      </div>
                    </div>

                    {queue.queueType === "ordered_distribution" && queue.members.length > 0 && (
                      <div className="p-2 bg-teal-50 rounded-lg">
                        <div className="text-xs text-teal-600 font-medium mb-1">Próximo na fila:</div>
                        {queue.distributionOrder && queue.distributionOrder.length > 0 ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {queue.members
                                  .find((m) => m.id === queue.distributionOrder![queue.currentIndex || 0])
                                  ?.name.split(" ")
                                  .map((n: string) => n[0])
                                  .join("") || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">
                              {queue.members.find((m) => m.id === queue.distributionOrder![queue.currentIndex || 0])
                                ?.name || "Não definido"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">Configure a ordem dos membros</span>
                        )}
                      </div>
                    )}

                    {queue.members.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {queue.members.slice(0, 4).map((member) => (
                              <Avatar key={member.id} className="h-6 w-6 border-2 border-background">
                                <AvatarFallback className="text-xs">
                                  {member.name
                                    .split(" ")
                                    .map((n: string) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                            {queue.members.length > 4 && (
                              <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                                <span className="text-xs text-muted-foreground">+{queue.members.length - 4}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {["admin", "manager", "employee"].map((role) => {
                            const count = queue.members.filter((m) => m.role === role).length
                            if (count > 0) {
                              return (
                                <Badge key={role} variant="outline" className={`text-xs ${getRoleColor(role)}`}>
                                  {count} {getRoleLabel(role)}
                                  {count > 1 ? "s" : ""}
                                </Badge>
                              )
                            }
                            return null
                          })}
                        </div>
                      </div>
                    )}

                    {queue.members.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhum membro atribuído</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 bg-transparent"
                          onClick={() => openMembersDialog(queue)}
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Adicionar Membros
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={isManageMembersOpen} onOpenChange={setIsManageMembersOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gerenciar Membros - {selectedQueueForMembers?.name}</DialogTitle>
            <DialogDescription>Adicione ou remova membros desta fila departamental</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {selectedQueueForMembers && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {getQueueTypeInfo(selectedQueueForMembers.queueType).icon}
                  <span className="font-medium">{getQueueTypeInfo(selectedQueueForMembers.queueType).label}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {getQueueTypeInfo(selectedQueueForMembers.queueType).description}
                </p>
              </div>
            )}

            {/* Current Members */}
            {selectedQueueForMembers && selectedQueueForMembers.members.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Membros Atuais ({selectedQueueForMembers.members.length})</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedQueueForMembers.members.map((member, index) => (
                    <div key={member.id} className="flex items-center justify-between p-2 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {selectedQueueForMembers.queueType === "ordered_distribution" && (
                          <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-medium">
                            {(selectedQueueForMembers.distributionOrder?.indexOf(member.id) ?? -1) + 1 || "?"}
                          </div>
                        )}
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-sm">
                            {member.name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{member.name}</p>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                        <Badge variant="outline" className={`text-xs ${getRoleColor(member.role)}`}>
                          {getRoleLabel(member.role)}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMemberFromQueue(selectedQueueForMembers.id, member.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Users */}
            <div>
              <h4 className="font-medium mb-3">Usuários Disponíveis</h4>
              {systemUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Nenhum usuário cadastrado no sistema</p>
                  <p className="text-xs mt-1">
                    Os usuários cadastrados no sistema aparecerão aqui para serem adicionados às filas
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {systemUsers
                    .filter((user) => !selectedQueueForMembers?.members.some((m) => m.id === user.id))
                    .map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-2 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-sm">
                              {user.name
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                          <Badge variant="outline" className={`text-xs ${getRoleColor(user.role)}`}>
                            {getRoleLabel(user.role)}
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => selectedQueueForMembers && addMemberToQueue(selectedQueueForMembers.id, user)}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Adicionar
                        </Button>
                      </div>
                    ))}
                  {systemUsers.filter((user) => !selectedQueueForMembers?.members.some((m) => m.id === user.id))
                    .length === 0 &&
                    systemUsers.length > 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        <p className="text-sm">Todos os usuários já foram adicionados a esta fila</p>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManageMembersOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
