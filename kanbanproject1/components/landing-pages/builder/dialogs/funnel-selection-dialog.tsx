import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApiFunnels } from '@/hooks/use-api-funnels';
import { Filter, AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FunnelSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  funnelId?: string;
  stageId?: string;
  onSelectionChange: (funnelId: string, stageId: string, stageName?: string) => void;
}

export function FunnelSelectionDialog({
  open,
  onOpenChange,
  funnelId,
  stageId,
  onSelectionChange,
}: FunnelSelectionDialogProps) {
  const { funnels, fetchFunnels, isLoading, error } = useApiFunnels();
  const [selectedFunnelId, setSelectedFunnelId] = useState<string>(funnelId || '');
  const [selectedStageId, setSelectedStageId] = useState<string>(stageId || '');

  useEffect(() => {
    if (open) {
      fetchFunnels();
    }
  }, [open, fetchFunnels]);

  useEffect(() => {
    if (funnelId) setSelectedFunnelId(funnelId);
    if (stageId) setSelectedStageId(stageId);
  }, [funnelId, stageId]);

  const selectedFunnel = funnels.find(f => f.id === selectedFunnelId);
  const stages = selectedFunnel?.columns || [];

  const handleSave = () => {
    const stage = stages.find(s => s.id === selectedStageId);
    onSelectionChange(selectedFunnelId, selectedStageId, stage?.name);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Vincular Funil
          </DialogTitle>
          <DialogDescription>
            Selecione o funil e a etapa onde os leads capturados serão criados.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Erro ao carregar funis: {error}
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-destructive underline ml-2" 
                  onClick={() => fetchFunnels()}
                >
                  Tentar novamente
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Funil</Label>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0" 
                onClick={() => fetchFunnels()} 
                disabled={isLoading}
                title="Atualizar lista de funis"
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <Select 
              value={selectedFunnelId} 
              onValueChange={(val) => {
                setSelectedFunnelId(val);
                setSelectedStageId(''); // Reset stage when funnel changes
              }}
              disabled={isLoading || funnels.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? "Carregando funis..." : "Selecione um funil"} />
              </SelectTrigger>
              <SelectContent>
                {funnels.length === 0 && !isLoading ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    Nenhum funil encontrado
                  </div>
                ) : (
                  funnels.map(funnel => (
                    <SelectItem key={funnel.id} value={funnel.id}>
                      {funnel.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {funnels.length === 0 && !isLoading && !error && (
              <p className="text-xs text-muted-foreground">
                Você ainda não possui funis cadastrados.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Etapa do Funil</Label>
            <Select 
              value={selectedStageId} 
              onValueChange={setSelectedStageId}
              disabled={!selectedFunnelId || stages.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma etapa" />
              </SelectTrigger>
              <SelectContent>
                {stages.map(stage => (
                  <SelectItem key={stage.id} value={stage.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: stage.color }}
                      />
                      {stage.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!selectedFunnelId || !selectedStageId}
          >
            Salvar Vinculação
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
