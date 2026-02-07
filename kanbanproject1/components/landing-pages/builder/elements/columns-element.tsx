import { BuilderElement } from '@/lib/types/builder-types';
import { ElementRenderer } from '../element-renderer';

interface Props {
  element: BuilderElement;
  onUpdate?: (updates: Partial<BuilderElement>) => void;
  onElementUpdate?: (id: string, updates: Partial<BuilderElement>) => void;
  onSelect?: (id: string | null) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  selectedId?: string | null;
}

export function ColumnsElement({ 
  element,
  onUpdate,
  onElementUpdate,
  onSelect,
  onDelete,
  onDuplicate,
  selectedId
}: Props) {
  const columns = element.content.columns || 2;
  const columnWidths = element.content.columnWidths;
  
  const styles: React.CSSProperties = {
    padding: element.styles.padding,
    margin: element.styles.margin,
    gap: element.styles.gap || '20px',
    alignItems: element.styles.alignItems || 'stretch',
    backgroundColor: element.styles.backgroundColor,
  };

  // Calculate grid template columns based on widths or count
  let gridTemplateColumns = `repeat(${columns}, 1fr)`;
  if (columnWidths && columnWidths.length === columns) {
      gridTemplateColumns = columnWidths.map(w => `${w}fr`).join(' ');
  }

  const containerStyles: React.CSSProperties = {
    ...styles,
    gridTemplateColumns,
  };

  return (
    <div 
      style={containerStyles}
      className="w-full grid"
    >
      {element.children?.map((child) => (
         <ElementRenderer 
            key={child.id}
            element={child}
            isSelected={selectedId === child.id}
            onUpdate={(updates: Partial<BuilderElement>) => onElementUpdate?.(child.id, updates)}
            onElementUpdate={onElementUpdate}
            onSelect={onSelect}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            selectedId={selectedId}
          />
      ))}
      {(!element.children || element.children.length === 0) && Array.from({ length: columns }).map((_, i) => (
        <div 
          key={i}
          className="min-h-[80px] bg-muted/30 border-2 border-dashed border-muted-foreground/20 rounded-lg flex items-center justify-center"
        >
          <span className="text-sm text-muted-foreground/50">Coluna {i + 1} (Vazia)</span>
        </div>
      ))}
    </div>
  );
}
