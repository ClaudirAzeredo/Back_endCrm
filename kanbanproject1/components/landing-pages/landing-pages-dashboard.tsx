"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, ExternalLink, Trash2, Edit, Users, QrCode } from "lucide-react"
import type { LandingPage } from "@/lib/types/landing-page"
import { getLandingPages, deleteLandingPage, saveLandingPage } from "@/lib/landing-page-storage"
import DragDropBuilder from "./drag-drop-builder"
import LandingPageDetails from "./landing-page-details"

export default function LandingPagesDashboard() {
  const [landingPages, setLandingPages] = useState<LandingPage[]>([])
  const [view, setView] = useState<"list" | "create" | "edit" | "details">("list")
  const [selectedPage, setSelectedPage] = useState<LandingPage | null>(null)
  const [qrCodeDialog, setQrCodeDialog] = useState<{ open: boolean; url: string; name: string }>({
    open: false,
    url: "",
    name: "",
  })

  useEffect(() => {
    loadLandingPages()
  }, [])

  const loadLandingPages = () => {
    setLandingPages(getLandingPages())
  }

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta landing page?")) {
      deleteLandingPage(id)
      loadLandingPages()
    }
  }

  const handleBack = () => {
    setView("list")
    setSelectedPage(null)
    loadLandingPages()
  }

  const getLandingPageUrl = (id: string) => {
    return `${window.location.origin}/lp/${id}`
  }

  const handleSave = (landingPageData: Omit<LandingPage, "id" | "createdAt" | "updatedAt">) => {
    const authData = localStorage.getItem("unicrm_auth")
    let companyId: string | undefined
    if (authData) {
      const parsed = JSON.parse(authData)
      companyId = parsed.user?.companyId
    }

    if (selectedPage) {
      // Editing existing page
      saveLandingPage({
        ...landingPageData,
        id: selectedPage.id,
        companyId: selectedPage.companyId || companyId,
        createdAt: selectedPage.createdAt,
        updatedAt: new Date().toISOString(),
      })
    } else {
      // Creating new page
      saveLandingPage({
        ...landingPageData,
        id: `lp_${Date.now()}`,
        companyId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }
    handleBack()
  }

  const showQrCode = (page: LandingPage) => {
    const url = getLandingPageUrl(page.id)
    setQrCodeDialog({ open: true, url, name: page.name })
  }

  if (view === "create") {
    return <DragDropBuilder onSave={handleSave} onClose={handleBack} />
  }

  if (view === "edit" && selectedPage) {
    return <DragDropBuilder landingPage={selectedPage} onSave={handleSave} onClose={handleBack} />
  }

  if (view === "details" && selectedPage) {
    return <LandingPageDetails landingPage={selectedPage} onBack={handleBack} />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Landing Pages</h2>
          <p className="text-muted-foreground">Gerencie suas páginas de captação de leads</p>
        </div>
        <Button onClick={() => setView("create")}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Landing Page
        </Button>
      </div>

      {landingPages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Nenhuma landing page criada</h3>
            <p className="text-muted-foreground mb-4">Crie sua primeira landing page para começar a capturar leads</p>
            <Button onClick={() => setView("create")}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Landing Page
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {landingPages.map((page) => (
            <Card key={page.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{page.name}</CardTitle>
                    {page.funnelStage && <CardDescription className="line-clamp-1">{page.funnelStage}</CardDescription>}
                  </div>
                  {page.funnelStage && (
                    <Badge variant="secondary" className="ml-2">
                      {page.funnelStage}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{page.leads?.length || 0} leads capturados</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPage(page)
                      setView("details")
                    }}
                  >
                    <Users className="w-4 h-4 mr-1" />
                    Ver Leads
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedPage(page)
                      setView("edit")
                    }}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      const url = getLandingPageUrl(page.id)
                      window.open(url, "_blank")
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Abrir
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => showQrCode(page)}>
                    <QrCode className="w-4 h-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(page.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={qrCodeDialog.open} onOpenChange={(open) => setQrCodeDialog({ ...qrCodeDialog, open })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code - {qrCodeDialog.name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="bg-white p-4 rounded-lg">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeDialog.url)}`}
                alt="QR Code"
                className="w-[200px] h-[200px]"
              />
            </div>
            <div className="w-full space-y-2">
              <p className="text-sm text-muted-foreground text-center">
                Escaneie o QR Code para acessar a landing page
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={qrCodeDialog.url}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(qrCodeDialog.url)
                  }}
                >
                  Copiar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
