export type ElementType = 
  | 'section' 
  | 'container' 
  | 'columns' 
  | 'column' 
  | 'heading' 
  | 'paragraph' 
  | 'button' 
  | 'image' 
  | 'video' 
  | 'form' 
  | 'spacer' 
  | 'divider' 
  | 'icon'
  | 'code';

export interface BuilderElement {
  id: string;
  type: ElementType;
  content?: string | Record<string, any>;
  props?: Record<string, any>;
  styles?: Record<string, any>;
  children?: BuilderElement[];
}

export interface PageSettings {
  title?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  favicon?: string;
  socialImage?: string;
  tagIds?: string[];
  funnelId?: string;
  stageId?: string;
  funnelStage?: string;
}

export const COMPONENT_DEFINITIONS: { 
  type: ElementType; 
  label: string; 
  icon: string;
  defaultContent?: Record<string, any>;
  defaultStyles?: Record<string, any>;
}[] = [
  { type: 'section', label: 'Seção', icon: 'Square' },
  { type: 'columns', label: 'Colunas', icon: 'Columns' },
  { type: 'heading', label: 'Título', icon: 'Type' },
  { type: 'paragraph', label: 'Texto', icon: 'AlignLeft' },
  { type: 'button', label: 'Botão', icon: 'MousePointer' },
  { type: 'image', label: 'Imagem', icon: 'Image' },
  { type: 'video', label: 'Vídeo', icon: 'Play' },
  { type: 'form', label: 'Formulário', icon: 'FileText' },
  { type: 'spacer', label: 'Espaço', icon: 'Minus' },
  { 
    type: 'code', 
    label: 'Código', 
    icon: 'Code',
    defaultContent: {
      html: '<div>\n  <!-- Insira seu código HTML/Embed aqui -->\n</div>'
    }
  },
];
