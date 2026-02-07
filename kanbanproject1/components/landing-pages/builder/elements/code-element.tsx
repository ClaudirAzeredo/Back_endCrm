import React from 'react';
import { BuilderElement } from '@/lib/types/builder-types';
import { cn } from '@/lib/utils';

interface Props {
  element: BuilderElement;
}

export function CodeElement({ element }: Props) {
  // Safety check
  if (!element || !element.styles) {
    console.error('CodeElement received invalid element:', element);
    return <div className="p-2 text-red-500">Erro: Elemento inválido</div>;
  }

  const styles: React.CSSProperties = {
    padding: element.styles.padding,
    margin: element.styles.margin,
    width: element.styles.width,
    height: element.styles.height,
    backgroundColor: element.styles.backgroundColor,
    color: element.styles.color,
    borderRadius: element.styles.borderRadius,
    borderWidth: element.styles.borderWidth,
    borderColor: element.styles.borderColor,
    borderStyle: element.styles.borderWidth ? 'solid' : undefined,
    textAlign: element.styles.textAlign,
    fontSize: element.styles.fontSize,
  };

  if (!element.content?.html) {
    return (
      <div className="p-4 border-2 border-dashed border-muted-foreground/20 rounded-lg flex items-center justify-center text-muted-foreground text-sm bg-muted/10 min-h-[80px]">
        Elemento de Código Vazio
      </div>
    );
  }

  return (
    <div 
      style={styles}
      className={cn("w-full overflow-hidden", !element.styles.width && "w-full")}
      dangerouslySetInnerHTML={{ __html: element.content.html }}
    />
  );
}
