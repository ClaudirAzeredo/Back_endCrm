"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, ExternalLink, QrCode, Copy, Check } from "lucide-react"
import type { LandingPage } from "@/lib/types/landing-page"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface LandingPageDetailsProps {
  landingPage: LandingPage
  onBack: () => void
}

export default function LandingPageDetails({ landingPage, onBack }: LandingPageDetailsProps) {
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedQr, setCopiedQr] = useState(false)

  const landingPageUrl = `${window.location.origin}/lp/${landingPage.id}`
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(landingPageUrl)}`

  const copyToClipboard = (text: string, type: "url" | "qr") => {
    navigator.clipboard.writeText(text)
    if (type === "url") {
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    } else {
      setCopiedQr(true)
      setTimeout(() => setCopiedQr(false), 2000)
    }
  }

  const downloadQRCode = () => {
    const link = document.createElement("a")
    link.href = qrCodeUrl
    link.download = `qrcode-${landingPage.name}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formElement = landingPage.elements?.find((el) => el.type === "form")
  const formFields = formElement?.formFields || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button variant="outline" onClick={() => window.open(landingPageUrl, "_blank")}>
          <ExternalLink className="w-4 h-4 mr-2" />
          Abrir Landing Page
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{landingPage.name}</CardTitle>
            <CardDescription>
              {landingPage.elements?.find((el) => el.type === "heading")?.content || "Landing Page"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {landingPage.funnelStage && (
              <div>
                <p className="text-sm font-medium mb-1">Etapa do Funil</p>
                <Badge>{landingPage.funnelStage}</Badge>
              </div>
            )}
            <div>
              <p className="text-sm font-medium mb-1">Leads Capturados</p>
              <p className="text-2xl font-bold">{landingPage.leads?.length || 0}</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Link da Landing Page</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={landingPageUrl}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
                />
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(landingPageUrl, "url")}>
                  {copiedUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>QR Code</CardTitle>
            <CardDescription>Compartilhe sua landing page via QR Code</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <img
                src={qrCodeUrl || "/placeholder.svg"}
                alt="QR Code"
                className="w-48 h-48 border-4 border-white rounded-lg shadow-lg"
              />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={downloadQRCode}>
                <QrCode className="w-4 h-4 mr-2" />
                Baixar QR Code
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>QR Code - {landingPage.name}</DialogTitle>
                    <DialogDescription>Escaneie este QR Code para acessar a landing page</DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-center py-4">
                    <img
                      src={qrCodeUrl || "/placeholder.svg"}
                      alt="QR Code"
                      className="w-64 h-64 border-4 border-white rounded-lg shadow-lg"
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leads Capturados</CardTitle>
          <CardDescription>{landingPage.leads?.length || 0} leads capturados nesta landing page</CardDescription>
        </CardHeader>
        <CardContent>
          {!landingPage.leads || landingPage.leads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Nenhum lead capturado ainda</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {formFields.map((field) => (
                      <TableHead key={field.id}>{field.label}</TableHead>
                    ))}
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {landingPage.leads.map((lead) => (
                    <TableRow key={lead.id}>
                      {formFields.map((field) => (
                        <TableCell key={field.id} className="font-medium">
                          {lead.formData[field.id] || "-"}
                        </TableCell>
                      ))}
                      <TableCell>{new Date(lead.submittedAt).toLocaleDateString("pt-BR")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
