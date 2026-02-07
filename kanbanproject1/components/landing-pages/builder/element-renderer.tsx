import { BuilderElement } from '@/lib/types/builder-types';
import { HeadingElement } from './elements/heading-element';
import { ParagraphElement } from './elements/paragraph-element';
import { ButtonElement } from './elements/button-element';
import { ImageElement } from './elements/image-element';
import { VideoElement } from './elements/video-element';
import { SectionElement } from './elements/section-element';
import { ColumnsElement } from './elements/columns-element';
import { ColumnElement } from './elements/column-element';
import { FormElement } from './elements/form-element';
import { SpacerElement } from './elements/spacer-element';
import { CodeElement } from './elements/code-element';

interface Props {
  element: BuilderElement;
  isSelected?: boolean;
  onUpdate?: (updates: Partial<BuilderElement>) => void; // Kept for backward compat or direct usage
  onElementUpdate?: (id: string, updates: Partial<BuilderElement>) => void; // Global update
  // Context props for nested elements
  onSelect?: (id: string | null) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  selectedId?: string | null;
}

export function ElementRenderer({ 
  element, 
  isSelected, 
  onUpdate,
  onElementUpdate,
  onSelect,
  onDelete,
  onDuplicate,
  selectedId
}: Props) {
  // Helper to use either local or global update
  const handleUpdate = (updates: Partial<BuilderElement>) => {
    if (onUpdate) onUpdate(updates);
    else if (onElementUpdate) onElementUpdate(element.id, updates);
  };

  switch (element.type) {
    case 'heading':
      return <HeadingElement element={element} />;
    case 'paragraph':
      return <ParagraphElement element={element} />;
    case 'button':
      return <ButtonElement element={element} />;
    case 'image':
      return <ImageElement element={element} isSelected={isSelected} onUpdate={handleUpdate} />;
    case 'video':
      return <VideoElement element={element} />;
    case 'section':
      return (
        <SectionElement 
          element={element}
          onUpdate={handleUpdate}
          onElementUpdate={onElementUpdate}
          onSelect={onSelect}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          selectedId={selectedId}
        />
      );
    case 'columns':
      return (
        <ColumnsElement 
          element={element} 
          onUpdate={handleUpdate}
          onElementUpdate={onElementUpdate}
          onSelect={onSelect}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          selectedId={selectedId}
        />
      );
    case 'column':
      return (
        <ColumnElement 
          element={element}
          onUpdate={handleUpdate}
          onElementUpdate={onElementUpdate}
          onSelect={onSelect}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          selectedId={selectedId}
        />
      );
    case 'form':
      return <FormElement element={element} />;
    case 'spacer':
      return <SpacerElement element={element} />;
    case 'code':
      return <CodeElement element={element} />;
    default:
      return <div>Elemento desconhecido: {element.type}</div>;
  }
}
