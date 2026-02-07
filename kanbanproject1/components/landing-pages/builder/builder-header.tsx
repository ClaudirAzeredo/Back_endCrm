import { Button } from '@/components/ui/button';
import { 
  Save, 
  Eye, 
  Download,
  LayoutTemplate,
  MoreVertical,
  Tag,
  Filter
} from 'lucide-react';
import { BuilderElement, PageSettings } from '@/lib/types/builder-types';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { TemplatesDialog } from './templates-dialog';
import { Template } from '@/lib/data/templates';
import { v4 as uuidv4 } from 'uuid';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TagSelectionDialog } from './dialogs/tag-selection-dialog';
import { FunnelSelectionDialog } from './dialogs/funnel-selection-dialog';

interface BuilderHeaderProps {
  elements: BuilderElement[];
  setElements: (elements: BuilderElement[]) => void;
  onSave?: (elements: BuilderElement[], settings?: PageSettings) => void;
  onClose?: () => void;
  initialSettings?: PageSettings;
  landingPageId?: string;
}

export function BuilderHeader({ elements, setElements, onSave, onClose, initialSettings, landingPageId }: BuilderHeaderProps) {
  const [showTemplates, setShowTemplates] = useState(false);
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<PageSettings>(initialSettings || {});
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [showFunnelDialog, setShowFunnelDialog] = useState(false);

  const handleTemplateSelect = (template: Template) => {
    if (elements.length > 0) {
      if (!confirm('Isso irá substituir o layout atual. Deseja continuar?')) {
        return;
      }
    }

    // Deep clone to ensure new IDs
    const cloneElement = (el: BuilderElement): BuilderElement => ({
      ...el,
      id: uuidv4(),
      children: el.children ? el.children.map(cloneElement) : undefined
    });

    const newElements = template.elements.map(cloneElement);
    
    setElements(newElements);
    setShowTemplates(false);
    toast({
      title: "Template aplicado!",
      description: `O template "${template.name}" foi carregado com sucesso.`,
    });
  };

  const handleSave = () => {
    if (onSave) {
      onSave(elements, settings);
    } else {
      const data = JSON.stringify(elements, null, 2);
      localStorage.setItem('landing-page-builder', data);
      toast({
        title: "Página salva!",
        description: "Seu layout foi salvo com sucesso.",
      });
    }
  };

  const handleLoad = () => {
    const data = localStorage.getItem('landing-page-builder');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        setElements(parsed);
        toast({
          title: "Página carregada!",
          description: "Seu layout foi restaurado com sucesso.",
        });
      } catch (e) {
        toast({
          title: "Erro ao carregar",
          description: "Não foi possível carregar o layout salvo.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Nenhum layout salvo",
        description: "Não há nenhum layout salvo no navegador.",
      });
    }
  };

  const handleExport = () => {
    const data = JSON.stringify(elements, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'landing-page.json';
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Exportado!",
      description: "O arquivo JSON foi baixado.",
    });
  };

  return (
    <header className="h-16 border-b border-border bg-card px-4 flex items-center justify-between shrink-0 z-20">
      <div className="flex items-center gap-4">
        <h1 className="font-bold text-lg">Page Weaver</h1>
        <div className="h-6 w-px bg-border" />
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowTemplates(true)}
          className="gap-2"
        >
          <LayoutTemplate className="w-4 h-4" />
          Templates
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowTagDialog(true)}>
              <Tag className="w-4 h-4 mr-2" />
              Vincular Tag
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowFunnelDialog(true)}>
              <Filter className="w-4 h-4 mr-2" />
              Vincular Funil
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="sm" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Exportar JSON
        </Button>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Voltar
          </Button>
        )}
        <Button size="sm" onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Salvar
        </Button>
        {landingPageId && (
          <Button 
            size="sm" 
            onClick={() => window.open(`${window.location.origin}/lp/${landingPageId}`, '_blank')}
          >
            <Eye className="w-4 h-4 mr-2" />
            Visualizar
          </Button>
        )}
      </div>

      <TemplatesDialog 
        open={showTemplates} 
        onOpenChange={setShowTemplates}
        onSelectTemplate={handleTemplateSelect}
      />
      
      <TagSelectionDialog
        open={showTagDialog}
        onOpenChange={setShowTagDialog}
        selectedTagIds={settings.tagIds || []}
        onTagsChange={(tagIds) => setSettings(prev => ({ ...prev, tagIds }))}
      />
      
      <FunnelSelectionDialog
        open={showFunnelDialog}
        onOpenChange={setShowFunnelDialog}
        funnelId={settings.funnelId}
        stageId={settings.stageId}
        onSelectionChange={(funnelId, stageId, funnelStage) => setSettings(prev => ({ ...prev, funnelId, stageId, funnelStage }))}
      />
    </header>
  );
}
