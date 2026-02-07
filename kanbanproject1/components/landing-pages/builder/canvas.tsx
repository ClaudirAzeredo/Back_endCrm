import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { BuilderElement } from '@/lib/types/builder-types';
import { ElementRenderer } from './element-renderer';
import { SortableElement } from './sortable-element';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CanvasProps {
  elements: BuilderElement[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onUpdate: (id: string, updates: Partial<BuilderElement>) => void;
}

export function Canvas({ elements, selectedId, onSelect, onDelete, onDuplicate, onUpdate }: CanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas',
  });

  return (
    <div className="flex-1 bg-muted/30 overflow-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div
          ref={setNodeRef}
          className={cn(
            'bg-background min-h-[calc(100vh-120px)] rounded-lg shadow-xl p-8 transition-colors',
            isOver && 'ring-2 ring-primary ring-offset-2'
          )}
          onClick={() => onSelect(null)}
        >
          {elements.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <GripVertical className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Canvas Vazio
              </h3>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                Arraste componentes da barra lateral esquerda para começar a construir sua landing page
              </p>
            </div>
          ) : (
            <SortableContext items={elements.map(e => e.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {elements.map((element) => (
                  <SortableElement
                    key={element.id}
                    element={element}
                    isSelected={selectedId === element.id}
                    onSelect={() => onSelect(element.id)}
                    onDelete={() => onDelete(element.id)}
                    onDuplicate={() => onDuplicate(element.id)}
                  >
                    <ElementRenderer 
                      element={element} 
                      isSelected={selectedId === element.id}
                      onUpdate={(updates) => onUpdate(element.id, updates)}
                      onElementUpdate={onUpdate}
                      onSelect={onSelect}
                      onDelete={onDelete}
                      onDuplicate={onDuplicate}
                      selectedId={selectedId}
                    />
                  </SortableElement>
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      </div>
    </div>
  );
}
