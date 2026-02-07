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

export function SectionElement({ 
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
      type: 'section',
    }
  });

  const styles: React.CSSProperties = {
    backgroundColor: element.styles.backgroundColor,
    padding: element.styles.padding || '20px',
    margin: element.styles.margin,
    borderRadius: element.styles.borderRadius,
    borderWidth: element.styles.borderWidth,
    borderColor: element.styles.borderColor,
    borderStyle: element.styles.borderWidth ? 'solid' : undefined,
    minHeight: '100px',
  };

  return (
    <div
      ref={setNodeRef}
      style={styles}
      className={cn(
        "w-full transition-colors",
        isOver && "ring-2 ring-primary/50 bg-muted/50",
        (!element.children || element.children.length === 0) && "bg-muted/10 border-dashed border border-muted-foreground/20"
      )}
    >
      <SortableContext 
        items={element.children?.map(e => e.id) || []} 
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4 w-full">
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
                onUpdate={(updates: Partial<BuilderElement>) => onElementUpdate?.(child.id, updates)}
                onElementUpdate={onElementUpdate}
                onSelect={onSelect}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                selectedId={selectedId}
              />
            </SortableElement>
          ))}
          {(!element.children || element.children.length === 0) && (
             <div className="h-full min-h-[100px] flex items-center justify-center text-sm text-muted-foreground/50">
               Seção - arraste elementos aqui
             </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
