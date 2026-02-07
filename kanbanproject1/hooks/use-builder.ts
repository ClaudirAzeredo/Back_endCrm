
import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { BuilderElement, ElementType, COMPONENT_DEFINITIONS } from '@/lib/types/builder-types';
import { 
  findElementById, 
  removeElementById, 
  updateElementById,
  insertElementAfter
} from '@/lib/builder/tree-utils';

export function useBuilder() {
  const [elements, setElements] = useState<BuilderElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const addElement = useCallback((type: ElementType, index?: number, parentId?: string) => {
    const definition = COMPONENT_DEFINITIONS.find(c => c.type === type);
    if (!definition) return;

    let children: BuilderElement[] | undefined = undefined;

    if (type === 'section') {
      children = [];
    } else if (type === 'columns') {
      // Create 2 default columns
      children = [
        {
          id: uuidv4(),
          type: 'column',
          content: {},
          styles: {},
          children: []
        },
        {
          id: uuidv4(),
          type: 'column',
          content: {},
          styles: {},
          children: []
        }
      ];
    } else if (type === 'column') {
      children = [];
    }

    const newElement: BuilderElement = {
      id: uuidv4(),
      type,
      content: { 
        ...definition.defaultContent,
        columns: type === 'columns' ? 2 : undefined
      },
      styles: { ...definition.defaultStyles },
      children
    };

    setElements(prev => {
      // If parentId is provided, we would add to that parent (not implemented in this simplified addElement yet, 
      // usually handled by dnd or specific insertion logic)
      
      if (index !== undefined) {
        const updated = [...prev];
        updated.splice(index, 0, newElement);
        return updated;
      }
      return [...prev, newElement];
    });

    setSelectedId(newElement.id);
  }, []);

  const updateElement = useCallback((id: string, updates: Partial<BuilderElement>) => {
    setElements(prev => updateElementById(prev, id, updates));
  }, []);

  const deleteElement = useCallback((id: string) => {
    setElements(prev => removeElementById(prev, id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  }, [selectedId]);

  const duplicateElement = useCallback((id: string) => {
    const location = findElementById(elements, id);
    if (!location) return;

    const element = location.element;

    // Deep clone with new IDs
    const cloneElement = (el: BuilderElement): BuilderElement => ({
      ...el,
      id: uuidv4(),
      content: { ...el.content },
      styles: { ...el.styles },
      children: el.children ? el.children.map(cloneElement) : undefined
    });

    const newElement = cloneElement(element);

    setElements(prev => insertElementAfter(prev, id, newElement));
  }, [elements]);

  const moveElement = useCallback((fromIndex: number, toIndex: number) => {
    // This is only for root level reordering for now, until we fully implement nested DnD
    setElements(prev => {
      const updated = [...prev];
      const [removed] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, removed);
      return updated;
    });
  }, []);

  const selectedElementLocation = selectedId ? findElementById(elements, selectedId) : null;
  const selectedElement = selectedElementLocation?.element || null;

  return {
    elements,
    selectedId,
    selectedElement,
    setSelectedId,
    addElement,
    updateElement,
    deleteElement,
    duplicateElement,
    moveElement,
    setElements
  };
}
