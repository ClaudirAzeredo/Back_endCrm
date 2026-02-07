import { BuilderElement, ElementContent, ElementStyles, COMPONENT_DEFINITIONS, FormFieldConfig } from '@/lib/types/builder-types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { countries } from '@/lib/builder/form-utils';
import { 
  Type, 
  AlignLeft, 
  MousePointer, 
  Image, 
  Play, 
  Square, 
  Columns, 
  FileText, 
  Minus,
  Settings,
  Palette,
  Ruler,
  Link,
  Lock,
  Unlock,
  Move,
  Plus,
  Trash,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface PropertiesPanelProps {
  element: BuilderElement | null;
  onUpdate: (id: string, updates: Partial<BuilderElement>) => void;
}

const iconMap: Record<string, React.ReactNode> = {
  heading: <Type className="w-4 h-4" />,
  paragraph: <AlignLeft className="w-4 h-4" />,
  button: <MousePointer className="w-4 h-4" />,
  image: <Image className="w-4 h-4" />,
  video: <Play className="w-4 h-4" />,
  section: <Square className="w-4 h-4" />,
  columns: <Columns className="w-4 h-4" />,
  form: <FileText className="w-4 h-4" />,
  spacer: <Minus className="w-4 h-4" />,
};

export function PropertiesPanel({ element, onUpdate }: PropertiesPanelProps) {
  if (!element) {
    return (
      <aside className="w-72 bg-card border-l border-border flex flex-col h-full shrink-0">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Propriedades
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <Settings className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Selecione um elemento para editar suas propriedades
            </p>
          </div>
        </div>
      </aside>
    );
  }

  const definition = COMPONENT_DEFINITIONS.find(c => c.type === element.type);

  const updateContent = <K extends keyof ElementContent>(key: K, value: ElementContent[K]) => {
    onUpdate(element.id, {
      content: { ...element.content, [key]: value }
    });
  };

  const updateStyles = <K extends keyof ElementStyles>(key: K, value: ElementStyles[K]) => {
    onUpdate(element.id, {
      styles: { ...element.styles, [key]: value }
    });
  };

  const handleColumnsChange = (count: number) => {
    const currentChildren = element.children || [];
    let newChildren = [...currentChildren];

    if (count > currentChildren.length) {
      // Add columns
      const toAdd = count - currentChildren.length;
      for (let i = 0; i < toAdd; i++) {
        newChildren.push({
          id: uuidv4(),
          type: 'column',
          content: {},
          styles: {},
          children: []
        });
      }
    } else if (count < currentChildren.length) {
      // Remove columns (from the end)
      newChildren = newChildren.slice(0, count);
    }

    onUpdate(element.id, {
      content: { ...element.content, columns: count },
      children: newChildren
    });
  };

  const addFormField = () => {
    const currentFields = element.content.formFields || [];
    const newField: FormFieldConfig = {
      id: uuidv4(),
      type: 'text',
      label: 'Novo Campo',
      placeholder: '',
      required: false,
      width: 'full'
    };
    
    updateContent('formFields', [...currentFields, newField]);
  };

  const updateFormField = (index: number, updates: Partial<FormFieldConfig>) => {
    const currentFields = [...(element.content.formFields || [])];
    const field = currentFields[index];
    
    if (typeof field === 'string') return; // Should not happen with new structure
    
    currentFields[index] = { ...field, ...updates };
    updateContent('formFields', currentFields);
  };

  const removeFormField = (index: number) => {
    const currentFields = [...(element.content.formFields || [])];
    currentFields.splice(index, 1);
    updateContent('formFields', currentFields);
  };

  const moveFormField = (index: number, direction: 'up' | 'down') => {
    const currentFields = [...(element.content.formFields || [])];
    if (direction === 'up' && index > 0) {
      [currentFields[index], currentFields[index - 1]] = [currentFields[index - 1], currentFields[index]];
    } else if (direction === 'down' && index < currentFields.length - 1) {
      [currentFields[index], currentFields[index + 1]] = [currentFields[index + 1], currentFields[index]];
    }
    updateContent('formFields', currentFields);
  };

  return (
    <aside className="w-80 bg-card border-l border-border flex flex-col h-full shrink-0 overflow-hidden">
      <div className="p-4 border-b border-border flex items-center gap-2">
        {definition?.icon && iconMap[definition.icon]}
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {definition?.label || element.type}
        </h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          
          {/* Content Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <FileText className="w-4 h-4" />
              Conteúdo
            </div>
            
            {element.type === 'heading' && (
              <div className="space-y-2">
                <Label>Texto</Label>
                <Input 
                  value={element.content.text || ''} 
                  onChange={(e) => updateContent('text', e.target.value)}
                />
              </div>
            )}

            {element.type === 'paragraph' && (
              <div className="space-y-2">
                <Label>Texto</Label>
                <Textarea 
                  value={element.content.text || ''} 
                  onChange={(e) => updateContent('text', e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            )}

            {element.type === 'button' && (
              <>
                <div className="space-y-2">
                  <Label>Texto do Botão</Label>
                  <Input 
                    value={element.content.text || ''} 
                    onChange={(e) => updateContent('text', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Link (URL)</Label>
                  <Input 
                    value={element.content.href || ''} 
                    onChange={(e) => updateContent('href', e.target.value)}
                    placeholder="https://"
                  />
                </div>
              </>
            )}

            {element.type === 'image' && (
              <>
                <div className="space-y-2">
                  <Label>URL da Imagem</Label>
                  <Input 
                    value={element.content.src || ''} 
                    onChange={(e) => updateContent('src', e.target.value)}
                    placeholder="https://"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Texto Alternativo (Alt)</Label>
                  <Input 
                    value={element.content.alt || ''} 
                    onChange={(e) => updateContent('alt', e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="aspect-ratio" 
                    checked={element.styles.aspectRatioLocked}
                    onCheckedChange={(checked) => updateStyles('aspectRatioLocked', checked)}
                  />
                  <Label htmlFor="aspect-ratio">Manter Proporção</Label>
                </div>
              </>
            )}

            {element.type === 'video' && (
              <div className="space-y-2">
                <Label>URL do Vídeo (YouTube/Vimeo)</Label>
                <Input 
                  value={element.content.videoUrl || ''} 
                  onChange={(e) => updateContent('videoUrl', e.target.value)}
                  placeholder="https://"
                />
              </div>
            )}

            {element.type === 'columns' && (
              <div className="space-y-2">
                <Label>Número de Colunas</Label>
                <Select 
                  value={String(element.content.columns || 2)} 
                  onValueChange={(v) => handleColumnsChange(parseInt(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Coluna</SelectItem>
                    <SelectItem value="2">2 Colunas</SelectItem>
                    <SelectItem value="3">3 Colunas</SelectItem>
                    <SelectItem value="4">4 Colunas</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="flex items-center space-x-2 pt-2">
                  <Switch 
                    id="stack-mobile" 
                    checked={element.content.stackOnMobile !== false}
                    onCheckedChange={(checked) => updateContent('stackOnMobile', checked)}
                  />
                  <Label htmlFor="stack-mobile">Empilhar no Mobile</Label>
                </div>
              </div>
            )}
            
            {element.type === 'form' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Texto do Botão</Label>
                  <Input 
                    value={element.content.submitLabel || 'Enviar'} 
                    onChange={(e) => updateContent('submitLabel', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Mensagem de Sucesso</Label>
                  <Input 
                    value={element.content.successMessage || 'Enviado com sucesso!'} 
                    onChange={(e) => updateContent('successMessage', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Redirecionar para (URL)</Label>
                  <Input 
                    value={element.content.redirectUrl || ''} 
                    onChange={(e) => updateContent('redirectUrl', e.target.value)}
                    placeholder="https://"
                  />
                </div>

                <Separator />
                
                <div className="flex items-center justify-between">
                  <Label>Campos do Formulário</Label>
                  <Button variant="outline" size="sm" onClick={addFormField}>
                    <Plus className="w-3 h-3 mr-1" /> Adicionar
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {(element.content.formFields || []).map((field, index) => {
                    if (typeof field === 'string') return null;
                    return (
                      <div key={field.id} className="border rounded-md p-3 space-y-3 bg-muted/20">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">Campo {index + 1}</span>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveFormField(index, 'up')} disabled={index === 0}>
                              <ChevronUp className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveFormField(index, 'down')} disabled={index === (element.content.formFields?.length || 0) - 1}>
                              <ChevronDown className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeFormField(index)}>
                              <Trash className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Rótulo</Label>
                            <Input 
                              value={field.label} 
                              onChange={(e) => updateFormField(index, { label: e.target.value })}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Tipo</Label>
                            <Select 
                              value={field.type} 
                              onValueChange={(v: any) => updateFormField(index, { type: v })}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Texto</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="tel">Telefone (Simples)</SelectItem>
                                <SelectItem value="phone">Telefone (Brasil)</SelectItem>
                                <SelectItem value="textarea">Área de Texto</SelectItem>
                                <SelectItem value="select">Seleção</SelectItem>
                                <SelectItem value="cpf">CPF</SelectItem>
                                <SelectItem value="cnpj">CNPJ</SelectItem>
                                <SelectItem value="cep">CEP</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs">Placeholder</Label>
                            <Input 
                              value={field.placeholder || ''} 
                              onChange={(e) => updateFormField(index, { placeholder: e.target.value })}
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Largura</Label>
                            <Select 
                              value={field.width || 'full'} 
                              onValueChange={(v: any) => updateFormField(index, { width: v })}
                            >
                              <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="full">100%</SelectItem>
                                <SelectItem value="half">50%</SelectItem>
                                <SelectItem value="third">33%</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch 
                            id={`required-${field.id}`}
                            checked={field.required}
                            onCheckedChange={(checked) => updateFormField(index, { required: checked })}
                          />
                          <Label htmlFor={`required-${field.id}`} className="text-xs">Obrigatório</Label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {element.type === 'code' && (
              <div className="space-y-2">
                <Label>Código HTML/Embed</Label>
                <Textarea 
                  value={element.content.html || ''} 
                  onChange={(e) => updateContent('html', e.target.value)}
                  className="min-h-[200px] font-mono text-xs"
                  placeholder="<div>...</div>"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Styles Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Palette className="w-4 h-4" />
              Estilo
            </div>

            <div className="space-y-2">
              <Label>Cor de Fundo</Label>
              <div className="flex gap-2">
                <Input 
                  type="color" 
                  value={element.styles.backgroundColor || '#ffffff'} 
                  onChange={(e) => updateStyles('backgroundColor', e.target.value)}
                  className="w-10 h-10 p-1 cursor-pointer"
                />
                <Input 
                  value={element.styles.backgroundColor || ''} 
                  onChange={(e) => updateStyles('backgroundColor', e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cor do Texto</Label>
              <div className="flex gap-2">
                <Input 
                  type="color" 
                  value={element.styles.color || '#000000'} 
                  onChange={(e) => updateStyles('color', e.target.value)}
                  className="w-10 h-10 p-1 cursor-pointer"
                />
                <Input 
                  value={element.styles.color || ''} 
                  onChange={(e) => updateStyles('color', e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Padding (Interno)</Label>
                <Input 
                  value={element.styles.padding || ''} 
                  onChange={(e) => updateStyles('padding', e.target.value)}
                  placeholder="20px"
                />
              </div>
              <div className="space-y-2">
                <Label>Margin (Externo)</Label>
                <Input 
                  value={element.styles.margin || ''} 
                  onChange={(e) => updateStyles('margin', e.target.value)}
                  placeholder="0px"
                />
              </div>
            </div>

            {(element.type === 'heading' || element.type === 'paragraph' || element.type === 'button') && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tamanho da Fonte</Label>
                    <Input 
                      value={element.styles.fontSize || ''} 
                      onChange={(e) => updateStyles('fontSize', e.target.value)}
                      placeholder="16px"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Peso da Fonte</Label>
                    <Select 
                      value={element.styles.fontWeight || 'normal'} 
                      onValueChange={(v) => updateStyles('fontWeight', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="medium">Médio</SelectItem>
                        <SelectItem value="bold">Negrito</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="200">200</SelectItem>
                        <SelectItem value="300">300</SelectItem>
                        <SelectItem value="400">400</SelectItem>
                        <SelectItem value="500">500</SelectItem>
                        <SelectItem value="600">600</SelectItem>
                        <SelectItem value="700">700</SelectItem>
                        <SelectItem value="800">800</SelectItem>
                        <SelectItem value="900">900</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Alinhamento</Label>
                  <div className="flex bg-muted rounded-md p-1">
                    <Button 
                      variant={element.styles.textAlign === 'left' ? 'secondary' : 'ghost'} 
                      size="sm" 
                      className="flex-1 h-8"
                      onClick={() => updateStyles('textAlign', 'left')}
                    >
                      Esq
                    </Button>
                    <Button 
                      variant={element.styles.textAlign === 'center' ? 'secondary' : 'ghost'} 
                      size="sm" 
                      className="flex-1 h-8"
                      onClick={() => updateStyles('textAlign', 'center')}
                    >
                      Centro
                    </Button>
                    <Button 
                      variant={element.styles.textAlign === 'right' ? 'secondary' : 'ghost'} 
                      size="sm" 
                      className="flex-1 h-8"
                      onClick={() => updateStyles('textAlign', 'right')}
                    >
                      Dir
                    </Button>
                    <Button 
                      variant={element.styles.textAlign === 'justify' ? 'secondary' : 'ghost'} 
                      size="sm" 
                      className="flex-1 h-8"
                      onClick={() => updateStyles('textAlign', 'justify')}
                    >
                      Just
                    </Button>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Borda</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input 
                  value={element.styles.borderWidth || ''} 
                  onChange={(e) => updateStyles('borderWidth', e.target.value)}
                  placeholder="Largura (1px)"
                />
                <Input 
                  value={element.styles.borderColor || ''} 
                  onChange={(e) => updateStyles('borderColor', e.target.value)}
                  placeholder="Cor (#ccc)"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Select 
                  value={element.styles.borderStyle || 'none'} 
                  onValueChange={(v) => updateStyles('borderStyle', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Estilo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    <SelectItem value="solid">Sólida</SelectItem>
                    <SelectItem value="dashed">Tracejada</SelectItem>
                    <SelectItem value="dotted">Pontilhada</SelectItem>
                  </SelectContent>
                </Select>
                <Input 
                  value={element.styles.borderRadius || ''} 
                  onChange={(e) => updateStyles('borderRadius', e.target.value)}
                  placeholder="Raio (4px)"
                />
              </div>
            </div>
            
            {(element.type === 'image' || element.type === 'button') && (
               <div className="space-y-2">
                <Label>Largura</Label>
                <Input 
                  value={element.styles.width || ''} 
                  onChange={(e) => updateStyles('width', e.target.value)}
                  placeholder="100% ou 200px"
                />
               </div>
            )}
            
            {element.type === 'section' && (
              <div className="space-y-2">
                <Label>Imagem de Fundo (URL)</Label>
                <Input 
                  value={element.styles.backgroundImage ? element.styles.backgroundImage.replace(/^url\(['"](.+)['"]\)$/, '$1') : ''} 
                  onChange={(e) => updateStyles('backgroundImage', e.target.value ? `url('${e.target.value}')` : undefined)}
                  placeholder="https://"
                />
                {element.styles.backgroundImage && (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Select 
                      value={element.styles.backgroundSize || 'cover'} 
                      onValueChange={(v) => updateStyles('backgroundSize', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cover">Cobrir</SelectItem>
                        <SelectItem value="contain">Conter</SelectItem>
                        <SelectItem value="auto">Original</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select 
                      value={element.styles.backgroundPosition || 'center'} 
                      onValueChange={(v) => updateStyles('backgroundPosition', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="center">Centro</SelectItem>
                        <SelectItem value="top">Topo</SelectItem>
                        <SelectItem value="bottom">Fundo</SelectItem>
                        <SelectItem value="left">Esquerda</SelectItem>
                        <SelectItem value="right">Direita</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </ScrollArea>
    </aside>
  );
}
