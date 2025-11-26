"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Settings, User, Shield, Eye } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type UserRole = "admin" | "client"

export default function AdminControls() {
  const [currentRole, setCurrentRole] = useState<UserRole>("client")

  useEffect(() => {
    const savedRole = (localStorage.getItem("user_role") as UserRole) || "client"
    setCurrentRole(savedRole)
  }, [])

  const changeRole = (newRole: UserRole) => {
    localStorage.setItem("user_role", newRole)
    setCurrentRole(newRole)
    // Reload the page to apply role changes
    window.location.reload()
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center text-sm">
          <Shield className="h-4 w-4 mr-2" />
          Controles de Administração
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">Papel atual:</span>
            <Badge variant={currentRole === "admin" ? "default" : "secondary"}>
              {currentRole === "admin" ? (
                <>
                  <Settings className="h-3 w-3 mr-1" />
                  Administrador
                </>
              ) : (
                <>
                  <User className="h-3 w-3 mr-1" />
                  Cliente
                </>
              )}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Alterar papel:</label>
          <Select value={currentRole} onValueChange={changeRole}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">
                <div className="flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Administrador - Acesso completo às configurações
                </div>
              </SelectItem>
              <SelectItem value="client">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Cliente - Apenas QR Code e conversas
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {currentRole === "admin" && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Eye className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Como administrador, você pode:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Configurar API keys e endpoints do WhatsApp</li>
                  <li>• Testar conexões da API</li>
                  <li>• Gerenciar configurações avançadas</li>
                  <li>• Acessar o botão de configurações no painel de conversas</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {currentRole === "client" && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Eye className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="text-sm text-green-800">
                <p className="font-medium mb-1">Como cliente, você vê apenas:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Interface para escanear QR Code</li>
                  <li>• Conversas do WhatsApp</li>
                  <li>• Envio e recebimento de mensagens</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
