import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { BuilderElement } from '@/lib/types/builder-types';
import { ElementRenderer } from '../element-renderer';
import { SortableElement } from '../sortable-element';
import { cn } from '@/lib/utils';

interface Props {
  element: BuilderElement;
  onUpdate?: (updates: Partial<BuilderElement>) => void;
  onElementUpdate?: (id: string, updates: Partial<BuilderElement>) => void;
  onSelect?: (id: string | null) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  selectedId?: string | null;
}

export function ColumnElement({ 
  element, 
  onUpdate, 
  onElementUpdate,
  onSelect, 
  onDelete, 
  onDuplicate, 
  selectedId 
}: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: element.id,
    data: {
      type: 'column',
    }
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-1 min-h-[50px] p-2 border border-dashed border-transparent transition-colors rounded-md",
        isOver && "bg-muted/50 border-primary/50",
        (!element.children || element.children.length === 0) && "bg-muted/30 border-muted-foreground/20"
      )}
    >
      <SortableContext 
        items={element.children?.map(e => e.id) || []} 
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2 w-full h-full flex flex-col">
          {element.children?.map((child) => (
            <SortableElement
              key={child.id}
              element={child}
              isSelected={selectedId === child.id}
              onSelect={() => onSelect?.(child.id)}
              onDelete={() => onDelete?.(child.id)}
              onDuplicate={() => onDuplicate?.(child.id)}
            >
              <ElementRenderer 
                element={child}
                isSelected={selectedId === child.id}
                onUpdate={(updates) => onElementUpdate?.(child.id, updates)}
                onElementUpdate={onElementUpdate}
                onSelect={onSelect}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                selectedId={selectedId}
              />
            </SortableElement>
          ))}
          {(!element.children || element.children.length === 0) && (
             <div className="h-full min-h-[50px] flex items-center justify-center text-xs text-muted-foreground/50">
               Arraste elementos aqui
             </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
