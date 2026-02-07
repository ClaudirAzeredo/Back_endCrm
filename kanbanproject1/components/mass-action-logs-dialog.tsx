"use client"

import { useEffect, useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, ListChecks } from "lucide-react"

type JobStatus = "queued" | "running" | "completed" | "failed"
type ItemStatus = "queued" | "sent" | "failed" | "skipped"

type JobRow = {
  id: string
  createdBy: any
  status: JobStatus
  totalLeads: number
  totalItems: number
  sentItems: number
  failedItems: number
  templateSnapshot?: any
  createdAt: string
}

type ItemRow = {
  id: string
  leadId: string
  phone: string
  status: ItemStatus
  errorMessage: string | null
  sentAt: string | null
}

function statusBadge(status: string) {
  if (status === "completed") return <Badge className="bg-green-100 text-green-800 border-green-200">Concluído</Badge>
  if (status === "running") return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Em andamento</Badge>
  if (status === "failed") return <Badge className="bg-red-100 text-red-800 border-red-200">Falhou</Badge>
  return <Badge variant="secondary">Em fila</Badge>
}

export default function MassActionLogsDialog({
  open,
  onOpenChange,
  initialJobId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialJobId: string | null
}) {
  const [jobs, setJobs] = useState<JobRow[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [items, setItems] = useState<ItemRow[]>([])
  const [isLoadingJobs, setIsLoadingJobs] = useState(false)
  const [isLoadingItems, setIsLoadingItems] = useState(false)

  useEffect(() => {
    if (!open) return
    setSelectedJobId(initialJobId)
  }, [open, initialJobId])

  const refreshJobs = async () => {
    setIsLoadingJobs(true)
    try {
      const res = await fetch("/api/mass-actions?limit=50")
      const data = (await res.json()) as JobRow[]
      setJobs(Array.isArray(data) ? data : [])
      if (!selectedJobId && Array.isArray(data) && data[0]?.id) setSelectedJobId(data[0].id)
    } finally {
      setIsLoadingJobs(false)
    }
  }

  const refreshItems = async (jobId: string) => {
    setIsLoadingItems(true)
    try {
      const res = await fetch(`/api/mass-actions/${jobId}/items?limit=500&offset=0`)
      const data = (await res.json()) as ItemRow[]
      setItems(Array.isArray(data) ? data : [])
    } finally {
      setIsLoadingItems(false)
    }
  }

  useEffect(() => {
    if (!open) return
    refreshJobs()
  }, [open])

  useEffect(() => {
    if (!open) return
    if (!selectedJobId) return
    refreshItems(selectedJobId)
  }, [open, selectedJobId])

  const selectedJob = useMemo(() => jobs.find((j) => j.id === selectedJobId) || null, [jobs, selectedJobId])

  const itemStats = useMemo(() => {
    const sent = items.filter((i) => i.status === "sent").length
    const failed = items.filter((i) => i.status === "failed").length
    const queued = items.filter((i) => i.status === "queued").length
    return { sent, failed, queued }
  }, [items])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5" />
            Logs de Disparo
          </DialogTitle>
          <DialogDescription>Acompanhe o status individual das mensagens e o histórico de execuções.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4">
          <div className="rounded-md border">
            <div className="flex items-center justify-between p-3 border-b">
              <div className="text-sm font-medium">Execuções</div>
              <Button variant="outline" size="sm" onClick={refreshJobs} disabled={isLoadingJobs}>
                {isLoadingJobs ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar"}
              </Button>
            </div>
            <ScrollArea className="h-[520px]">
              <div className="p-2 space-y-2">
                {jobs.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-3">Nenhum disparo encontrado.</div>
                ) : (
                  jobs.map((j) => (
                    <button
                      key={j.id}
                      type="button"
                      onClick={() => setSelectedJobId(j.id)}
                      className={`w-full text-left rounded-md border px-3 py-2 hover:bg-muted transition-colors ${
                        selectedJobId === j.id ? "bg-muted" : "bg-background"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-medium truncate">{j.templateSnapshot?.name || "Template"}</div>
                        {statusBadge(j.status)}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground truncate">{new Date(j.createdAt).toLocaleString()}</div>
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        <div className="rounded border p-2">
                          <div className="text-[10px] text-muted-foreground">Leads</div>
                          <div className="text-sm font-semibold">{j.totalLeads}</div>
                        </div>
                        <div className="rounded border p-2">
                          <div className="text-[10px] text-muted-foreground">Enviadas</div>
                          <div className="text-sm font-semibold">{j.sentItems}</div>
                        </div>
                        <div className="rounded border p-2">
                          <div className="text-[10px] text-muted-foreground">Falhas</div>
                          <div className="text-sm font-semibold">{j.failedItems}</div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="rounded-md border">
            <div className="flex items-center justify-between p-3 border-b">
              <div className="text-sm font-medium">Detalhes</div>
              {selectedJobId && (
                <Button variant="outline" size="sm" onClick={() => refreshItems(selectedJobId)} disabled={isLoadingItems}>
                  {isLoadingItems ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar"}
                </Button>
              )}
            </div>

            {!selectedJob ? (
              <div className="p-4 text-sm text-muted-foreground">Selecione um disparo para ver os detalhes.</div>
            ) : (
              <div className="p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{selectedJob.templateSnapshot?.name || "Template"}</div>
                    <div className="text-xs text-muted-foreground">Job: {selectedJob.id}</div>
                    <div className="text-xs text-muted-foreground">Autor: {selectedJob.createdBy?.name || "-"}</div>
                  </div>
                  {statusBadge(selectedJob.status)}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Mensagens</div>
                    <div className="text-lg font-semibold">{selectedJob.totalItems}</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Enviadas</div>
                    <div className="text-lg font-semibold">{itemStats.sent}</div>
                  </div>
                  <div className="rounded-md border p-3">
                    <div className="text-xs text-muted-foreground">Falhas</div>
                    <div className="text-lg font-semibold">{itemStats.failed}</div>
                  </div>
                </div>

                <Tabs defaultValue="itens">
                  <TabsList>
                    <TabsTrigger value="itens">Itens</TabsTrigger>
                    <TabsTrigger value="erros">Erros</TabsTrigger>
                  </TabsList>
                  <TabsContent value="itens" className="mt-3">
                    <ScrollArea className="h-[320px] rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Lead</TableHead>
                            <TableHead>Telefone</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Horário</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items.map((it) => (
                            <TableRow key={it.id}>
                              <TableCell className="font-mono text-xs">{it.leadId}</TableCell>
                              <TableCell className="font-mono text-xs">{it.phone}</TableCell>
                              <TableCell>{statusBadge(it.status)}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {it.sentAt ? new Date(it.sentAt).toLocaleString() : "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="erros" className="mt-3">
                    <ScrollArea className="h-[320px] rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Telefone</TableHead>
                            <TableHead>Motivo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {items
                            .filter((i) => i.status === "failed")
                            .map((it) => (
                              <TableRow key={it.id}>
                                <TableCell className="font-mono text-xs">{it.phone}</TableCell>
                                <TableCell className="text-xs">{it.errorMessage || "Falha"}</TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

