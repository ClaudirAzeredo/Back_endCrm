import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { useState, useEffect } from 'react';
import { ComponentsSidebar } from './components-sidebar';
import { Canvas } from './canvas';
import { PropertiesPanel } from './properties-panel';
import { BuilderHeader } from './builder-header';
import { useBuilder } from '@/hooks/use-builder';
import { ElementType, COMPONENT_DEFINITIONS, BuilderElement, PageSettings } from '@/lib/types/builder-types';
import { findElementById, moveElement, insertElementAfter, insertElementAtEnd } from '@/lib/builder/tree-utils';
import { v4 as uuidv4 } from 'uuid';

interface BuilderLayoutProps {
  initialElements?: BuilderElement[];
  onSave?: (elements: BuilderElement[], settings?: PageSettings) => void;
  onClose?: () => void;
  initialSettings?: PageSettings;
}

export function BuilderLayout({ initialElements, onSave, onClose, initialSettings }: BuilderLayoutProps) {
  const {
    elements,
    selectedId,
    selectedElement,
    setSelectedId,
    updateElement,
    deleteElement,
    duplicateElement,
    setElements,
  } = useBuilder();

  useEffect(() => {
    if (initialElements) {
      setElements(initialElements);
    }
  }, []); // Run only once on mount

  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    // Only handle moving existing elements during drag over
    if (activeIdStr.startsWith('new-')) return;

    // Use moveElement to speculatively move items in the UI
    const activeNode = findElementById(elements, activeIdStr);
    const overNode = findElementById(elements, overIdStr);

    if (!activeNode || !overNode) return;

    // Only move if they are in different containers to avoid flickering in same container
    // But dnd-kit sortable needs items to be in the list to sort them.
    // If we move across containers, we must update state.
    if (activeNode.parent?.id !== overNode.parent?.id) {
       setElements((items) => moveElement(items, activeIdStr, overIdStr));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);
    
    // Handle new component
    if (activeIdStr.startsWith('new-')) {
      const type = activeIdStr.replace('new-', '') as ElementType;
      const definition = COMPONENT_DEFINITIONS.find(c => c.type === type);
      if (!definition) return;

      // Create new element logic
      let children: BuilderElement[] | undefined = undefined;
      if (type === 'section') children = [];
      else if (type === 'columns') {
         children = [
            { id: uuidv4(), type: 'column', content: {}, styles: {}, children: [] },
            { id: uuidv4(), type: 'column', content: {}, styles: {}, children: [] }
         ];
      } else if (type === 'column') children = [];

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
      
      const overNode = findElementById(elements, overIdStr);
      const isContainer = overNode && (overNode.element.type === 'column' || overNode.element.type === 'section');

      if (overIdStr === 'canvas') {
        setElements(prev => [...prev, newElement]);
      } else if (isContainer) {
        setElements(prev => insertElementAtEnd(prev, overIdStr, newElement));
      } else {
        setElements(prev => insertElementAfter(prev, overIdStr, newElement));
      }
    } else {
        // Handle existing component move (reorder)
        if (activeIdStr !== overIdStr) {
            setElements((items) => moveElement(items, activeIdStr, overIdStr));
        }
    }
  };

  const getActiveComponent = () => {
    if (!activeId) return null;
    
    if (activeId.startsWith('new-')) {
      const type = activeId.replace('new-', '') as ElementType;
      const def = COMPONENT_DEFINITIONS.find(c => c.type === type);
      return def?.label || type;
    }
    
    const node = findElementById(elements, activeId);
    if (node) {
      const def = COMPONENT_DEFINITIONS.find(c => c.type === node.element.type);
      return def?.label || node.element.type;
    }
    
    return null;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="h-screen flex flex-col bg-background">
        <BuilderHeader 
          elements={elements} 
          setElements={setElements} 
          onSave={onSave}
          onClose={onClose}
          initialSettings={initialSettings}
        />
        
        <div className="flex-1 flex overflow-hidden">
          <ComponentsSidebar />
          <Canvas
            elements={elements}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDelete={deleteElement}
            onDuplicate={duplicateElement}
            onUpdate={updateElement}
          />
          <PropertiesPanel
            element={selectedElement}
            onUpdate={updateElement}
          />
        </div>
      </div>

      <DragOverlay>
        {activeId && (
          <div className="px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-xl text-sm font-medium animate-pulse">
            {getActiveComponent()}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
