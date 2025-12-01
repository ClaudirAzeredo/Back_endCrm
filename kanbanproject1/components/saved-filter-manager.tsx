"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Save, Trash2, Check, Star, Filter } from "lucide-react"
import type { SavedFilter } from "@/lib/saved-filters"

type FilterRule = {
  id: string
  field: "user" | "tag" | "priority" | "source"
  value: string
}

type SavedFilterManagerProps = {
  open: boolean
  onClose: () => void
  savedFilters: SavedFilter[]
  currentFilterRules: FilterRule[]
  onApplyFilter: (rules: FilterRule[]) => void
  onSaveFilter: (name: string) => void
  onDeleteFilter: (filterId: string) => void
  getFieldLabel: (field: string) => string
  getValueLabel: (field: string, value: string) => string
}

export default function SavedFilterManager({
  open,
  onClose,
  savedFilters,
  currentFilterRules,
  onApplyFilter,
  onSaveFilter,
  onDeleteFilter,
  getFieldLabel,
  getValueLabel,
}: SavedFilterManagerProps) {
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [filterName, setFilterName] = useState("")

  const handleSaveFilter = () => {
    if (!filterName.trim()) {
      alert("Por favor, insira um nome para o filtro")
      return
    }
    onSaveFilter(filterName)
    setFilterName("")
    setIsSaveDialogOpen(false)
  }

  const handleApplyFilter = (filter: SavedFilter) => {
    onApplyFilter(filter.rules as FilterRule[])
    onClose()
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Filtros Salvos
            </DialogTitle>
            <DialogDescription>Gerencie seus filtros personalizados salvos</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Save current filter button */}
            {currentFilterRules.length > 0 && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Filtro Atual</p>
                    <p className="text-sm text-muted-foreground">{currentFilterRules.length} regra(s) ativa(s)</p>
                  </div>
                  <Button onClick={() => setIsSaveDialogOpen(true)} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Filtro Atual
                  </Button>
                </div>
              </div>
            )}

            {/* List of saved filters */}
            <ScrollArea className="h-[400px] pr-4">
              {savedFilters.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum filtro salvo ainda</p>
                  <p className="text-sm mt-2">Crie filtros personalizados e salve-os para acesso rápido</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedFilters.map((filter) => (
                    <div key={filter.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium flex items-center gap-2">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            {filter.name}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            Criado em {new Date(filter.createdAt).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleApplyFilter(filter)}>
                            <Check className="h-4 w-4 mr-1" />
                            Aplicar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => onDeleteFilter(filter.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>

                      {/* Display filter rules */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {(filter.rules as FilterRule[]).map((rule) => (
                          <Badge key={rule.id} variant="secondary" className="text-xs">
                            {getFieldLabel(rule.field)}: {getValueLabel(rule.field, rule.value)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save filter dialog */}
      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Filtro</DialogTitle>
            <DialogDescription>Dê um nome para este filtro para acessá-lo rapidamente no futuro</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="filter-name">Nome do Filtro</Label>
              <Input
                id="filter-name"
                placeholder="Ex: Leads do João com tag Urgente"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveFilter()
                  }
                }}
              />
            </div>

            {/* Preview of current rules */}
            <div className="space-y-2">
              <Label>Regras do Filtro</Label>
              <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-md">
                {currentFilterRules.map((rule) => (
                  <Badge key={rule.id} variant="secondary">
                    {getFieldLabel(rule.field)}: {getValueLabel(rule.field, rule.value)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveFilter}>
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
