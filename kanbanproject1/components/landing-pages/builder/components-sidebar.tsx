import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
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
  GripVertical,
  Code
} from 'lucide-react';
import { COMPONENT_DEFINITIONS, ElementType } from '@/lib/types/builder-types';

const iconMap: Record<string, React.ReactNode> = {
  Type: <Type className="w-5 h-5" />,
  AlignLeft: <AlignLeft className="w-5 h-5" />,
  MousePointer: <MousePointer className="w-5 h-5" />,
  Image: <Image className="w-5 h-5" />,
  Play: <Play className="w-5 h-5" />,
  Square: <Square className="w-5 h-5" />,
  Columns: <Columns className="w-5 h-5" />,
  FileText: <FileText className="w-5 h-5" />,
  Minus: <Minus className="w-5 h-5" />,
  Code: <Code className="w-5 h-5" />,
};

interface DraggableComponentProps {
  type: ElementType;
  label: string;
  icon: string;
}

function DraggableComponent({ type, label, icon }: DraggableComponentProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `new-${type}`,
    data: { type, isNew: true }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="component-card group cursor-grab active:cursor-grabbing"
    >
      <div className="p-2 rounded-md bg-muted border border-border group-hover:bg-primary/20 transition-colors flex flex-col items-center justify-center gap-2 h-24">
        {iconMap[icon]}
        <span className="text-xs font-medium text-center">{label}</span>
      </div>
    </div>
  );
}

export function ComponentsSidebar() {
  return (
    <aside className="w-64 bg-card text-card-foreground flex flex-col h-full border-r border-border shrink-0">
      <div className="p-4 border-b border-border">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Componentes
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Arraste para o canvas
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        <div className="grid grid-cols-2 gap-3">
          {COMPONENT_DEFINITIONS.map((component) => (
            <DraggableComponent
              key={component.type}
              type={component.type}
              label={component.label}
              icon={component.icon}
            />
          ))}
        </div>
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <GripVertical className="w-4 h-4" />
          <span>Arraste e solte os elementos</span>
        </div>
      </div>
    </aside>
  );
}
