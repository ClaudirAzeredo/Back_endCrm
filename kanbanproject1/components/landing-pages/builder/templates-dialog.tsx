import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { TEMPLATES, Template } from '@/lib/data/templates';
import { Layout, MousePointerClick } from 'lucide-react';

interface TemplatesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: Template) => void;
}

export function TemplatesDialog({ open, onOpenChange, onSelectTemplate }: TemplatesDialogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'lead-generation', label: 'Geração de Leads' },
    { id: 'sales', label: 'Página de Vendas' },
    { id: 'product', label: 'Produto' },
    { id: 'webinar', label: 'Webinar / Evento' },
    { id: 'waiting-list', label: 'Lista de Espera' },
    { id: 'contact', label: 'Orçamento / B2B' },
    { id: 'health', label: 'Saúde' },
    { id: 'real-estate', label: 'Imobiliário' },
  ];

  const filteredTemplates = selectedCategory && selectedCategory !== 'all'
    ? TEMPLATES.filter(t => t.category === selectedCategory)
    : TEMPLATES;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col p-0 gap-0 bg-background/95 backdrop-blur-xl">
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Layout className="w-6 h-6 text-primary" />
            Escolha um Modelo
          </DialogTitle>
          <DialogDescription className="text-base">
            Comece com um template profissional e personalize como quiser.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Filters */}
          <aside className="w-64 border-r p-4 flex flex-col gap-2 bg-muted/30">
            <h3 className="text-sm font-semibold text-muted-foreground mb-2 px-2">Categorias</h3>
            {categories.map(cat => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id || (cat.id === 'all' && !selectedCategory) ? "secondary" : "ghost"}
                className="justify-start w-full"
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label}
              </Button>
            ))}
          </aside>

          {/* Templates Grid */}
          <ScrollArea className="flex-1 p-8 bg-muted/10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <div 
                  key={template.id}
                  className="group relative bg-card border rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] flex flex-col h-[320px]"
                >
                  {/* Thumbnail Placeholder */}
                  <div className="h-40 bg-muted flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                    <Layout className="w-12 h-12 text-muted-foreground/30 group-hover:scale-110 transition-transform duration-500" />
                    
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0 z-20 px-4">
                      <Button 
                        size="sm" 
                        className="w-full font-semibold shadow-lg"
                        onClick={() => onSelectTemplate(template)}
                      >
                        <MousePointerClick className="w-4 h-4 mr-2" />
                        Usar Template
                      </Button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="outline" className="text-xs font-normal bg-primary/5 text-primary border-primary/20">
                        {categories.find(c => c.id === template.category)?.label}
                      </Badge>
                    </div>
                    
                    <h3 className="font-bold text-lg leading-tight mb-2 group-hover:text-primary transition-colors">
                      {template.name}
                    </h3>
                    
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {template.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
