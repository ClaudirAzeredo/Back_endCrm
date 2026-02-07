import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Trash2, Edit, Loader2 } from "lucide-react"
import { leadsApi, Lead } from "@/lib/api/leads-api"
import { toast } from "@/hooks/use-toast"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Funnel } from "@/lib/api/funnels-api"

interface LeadCenterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEditLead: (lead: Lead) => void
  onDeleteLead: (leadId: string) => Promise<void>
  funnels: Funnel[]
}

export function LeadCenterDialog({ open, onOpenChange, onEditLead, onDeleteLead, funnels }: LeadCenterDialogProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")

  useEffect(() => {
    if (open) {
      loadLeads()
    }
  }, [open])

  const loadLeads = async () => {
    setLoading(true)
    try {
      const data = await leadsApi.getLeads()
      setLeads(data)
    } catch (error) {
      console.error("Failed to load leads", error)
      toast({
        title: "Erro ao carregar leads",
        description: "Não foi possível carregar a lista de leads.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusName = (lead: Lead) => {
    const funnel = funnels.find(f => f.id === lead.funnelId)
    if (!funnel) return lead.status
    const column = funnel.columns.find(c => c.id === lead.status)
    return column ? column.name : lead.status
  }

  const getFunnelName = (lead: Lead) => {
    const funnel = funnels.find(f => f.id === lead.funnelId)
    return funnel ? funnel.name : "-"
  }

  const filteredLeads = leads.filter(lead => 
    lead.title.toLowerCase().includes(search.toLowerCase()) ||
    lead.client.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este lead?")) {
        try {
            await onDeleteLead(id)
            setLeads(prev => prev.filter(l => l.id !== id))
        } catch (error) {
            console.error(error)
        }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Central de Leads</DialogTitle>
          <DialogDescription>Gerencie todos os leads cadastrados no sistema.</DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center gap-2 py-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por título ou cliente..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1"
          />
        </div>

        <div className="flex-1 overflow-auto border rounded-md">
            {loading ? (
                <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Título</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Funil</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Data Criação</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLeads.map(lead => (
                            <TableRow key={lead.id}>
                                <TableCell className="font-medium">{lead.title}</TableCell>
                                <TableCell>{lead.client}</TableCell>
                                <TableCell>{getFunnelName(lead)}</TableCell>
                                <TableCell>{getStatusName(lead)}</TableCell>
                                <TableCell>{lead.createdAt ? format(new Date(lead.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR }) : "-"}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => onEditLead(lead)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(lead.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredLeads.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    Nenhum lead encontrado.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
