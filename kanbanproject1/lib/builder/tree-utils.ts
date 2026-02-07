
import { BuilderElement } from '@/lib/types/builder-types';
import { arrayMove } from '@dnd-kit/sortable';

export interface NodeLocation {
  parent: BuilderElement | null; // null if root
  index: number;
  element: BuilderElement;
  list: BuilderElement[]; // The array containing the element
}

export const findElementById = (
  elements: BuilderElement[],
  id: string
): NodeLocation | null => {
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].id === id) {
      return {
        parent: null,
        index: i,
        element: elements[i],
        list: elements,
      };
    }
    
    if (elements[i].children) {
      const result = findNestedElement(elements[i].children!, id, elements[i]);
      if (result) return result;
    }
  }
  return null;
};

const findNestedElement = (
  elements: BuilderElement[],
  id: string,
  parent: BuilderElement
): NodeLocation | null => {
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].id === id) {
      return {
        parent,
        index: i,
        element: elements[i],
        list: elements,
      };
    }
    
    if (elements[i].children) {
      const result = findNestedElement(elements[i].children!, id, elements[i]);
      if (result) return result;
    }
  }
  return null;
};

export const removeElementById = (elements: BuilderElement[], id: string): BuilderElement[] => {
  return elements.filter(el => {
    if (el.id === id) return false;
    if (el.children) {
      el.children = removeElementById(el.children, id);
    }
    return true;
  });
};

export const updateElementById = (
  elements: BuilderElement[],
  id: string,
  updates: Partial<BuilderElement>
): BuilderElement[] => {
  return elements.map(el => {
    if (el.id === id) {
      return { ...el, ...updates };
    }
    if (el.children) {
      return {
        ...el,
        children: updateElementById(el.children, id, updates)
      };
    }
    return el;
  });
};

export const insertElementAfter = (
  elements: BuilderElement[],
  targetId: string,
  newElement: BuilderElement
): BuilderElement[] => {
  const newElements = [...elements];
  
  // Check if target is in this list
  const index = newElements.findIndex(el => el.id === targetId);
  if (index !== -1) {
    newElements.splice(index + 1, 0, newElement);
    return newElements;
  }

  // Recursive check
  return newElements.map(el => {
    if (el.children) {
      return {
        ...el,
        children: insertElementAfter(el.children, targetId, newElement)
      };
    }
    return el;
  });
};

export const insertElementAtEnd = (
  elements: BuilderElement[],
  parentId: string,
  newElement: BuilderElement
): BuilderElement[] => {
  return elements.map(el => {
    if (el.id === parentId) {
      return {
        ...el,
        children: [...(el.children || []), newElement]
      };
    }
    if (el.children) {
      return {
        ...el,
        children: insertElementAtEnd(el.children, parentId, newElement)
      };
    }
    return el;
  });
};

// Helper to deep clone the tree to avoid mutation issues
const cloneTree = (items: BuilderElement[]): BuilderElement[] => {
  return JSON.parse(JSON.stringify(items));
};

export const moveElement = (
  elements: BuilderElement[],
  activeId: string,
  overId: string
): BuilderElement[] => {
  const activeNode = findElementById(elements, activeId);
  const overNode = findElementById(elements, overId);

  if (!activeNode || !overNode) return elements;

  const activeParentId = activeNode.parent?.id || 'root';
  const overParentId = overNode.parent?.id || 'root';

  // If same parent, just reorder
  if (activeParentId === overParentId) {
    // If it's the root list
    if (activeParentId === 'root') {
      return arrayMove(elements, activeNode.index, overNode.index);
    }

    // If it's a nested list, we need to find the parent and update its children
    return updateElementById(elements, activeParentId, {
      children: arrayMove(activeNode.list, activeNode.index, overNode.index)
    });
  }

  // If different parents, move from one to another
  let newElements = removeElementById(elements, activeId);
  
  // Insert into new location
  // We need to insert it *relative* to the overId
  // The insertElementAfter logic is a bit simple, let's refine it or use a specific insert function
  
  // If we are dropping ONTO a container (like an empty column), we might want to append to it
  // But here overId is usually a Sortable item.
  
  // If overNode is a container and it's empty, we might be dropping onto it?
  // SortableContext usually gives overId of the item.
  
  // Let's assume we drop relative to the item (sortable behavior)
  newElements = insertElementAfter(newElements, overId, activeNode.element);
  
  return newElements;
};

export const moveElementToContainer = (
  elements: BuilderElement[],
  activeId: string,
  overId: string
): BuilderElement[] => {
  const clonedItems = JSON.parse(JSON.stringify(elements));
  const activeNode = findElementById(clonedItems, activeId);
  
  if (!activeNode) return elements;
  const activeElement = activeNode.element;

  // Remover o elemento de sua posição atual
  const itemsWithoutActive = removeElementById(clonedItems, activeId);
  
  // Função recursiva para encontrar o container e adicionar o elemento
  const addToContainer = (items: BuilderElement[]): BuilderElement[] => {
    return items.map(item => {
      if (item.id === overId) {
        // Se este é o container alvo, adiciona ao final dos filhos
        return {
          ...item,
          children: [...(item.children || []), activeElement]
        };
      }
      
      if (item.children && item.children.length > 0) {
        return {
          ...item,
          children: addToContainer(item.children)
        };
      }
      
      return item;
    });
  };

  return addToContainer(itemsWithoutActive);
};
