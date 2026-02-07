import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BuilderElement } from '@/lib/types/builder-types';
import { Trash2, Copy, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortableElementProps {
  element: BuilderElement;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  children: React.ReactNode;
}

export function SortableElement({ 
  element, 
  isSelected, 
  onSelect, 
  onDelete, 
  onDuplicate, 
  children 
}: SortableElementProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: element.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Don't apply builder-component hover effect to images when selected (they have their own)
  const isImage = element.type === 'image';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'builder-component group relative w-full',
        isSelected && !isImage && 'selected ring-2 ring-primary ring-offset-2',
        isImage && isSelected && 'outline-none'
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {/* Element Controls */}
      <div className={cn(
        'absolute -top-3 -right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10',
        isSelected && 'opacity-100'
      )}>
        <button
          {...attributes}
          {...listeners}
          className="p-1.5 bg-primary text-primary-foreground rounded-md shadow-lg cursor-grab active:cursor-grabbing hover:bg-primary/90"
        >
          <GripVertical className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="p-1.5 bg-card text-card-foreground rounded-md shadow-lg hover:bg-muted"
        >
          <Copy className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 bg-destructive text-destructive-foreground rounded-md shadow-lg hover:bg-destructive/90"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Element Content */}
      {children}
    </div>
  );
}
