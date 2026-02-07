import { BuilderElement } from '@/lib/types/builder-types';
import { ImageIcon, Lock, Unlock } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface Props {
  element: BuilderElement;
  isSelected?: boolean;
  onUpdate?: (updates: Partial<BuilderElement>) => void;
}

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

export function ImageElement({ element, isSelected, onUpdate }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [activeHandle, setActiveHandle] = useState<ResizeHandle | null>(null);
  const [dimensions, setDimensions] = useState({
    width: parseInt(element.styles.width || '100%') || 400,
    height: element.styles.height === 'auto' ? 0 : parseInt(element.styles.height || '0') || 0,
  });
  const [aspectRatio, setAspectRatio] = useState(1);
  const startPos = useRef({ x: 0, y: 0, width: 0, height: 0 });

  const isLocked = element.styles.aspectRatioLocked !== false;

  // Get natural dimensions when image loads
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const ratio = img.naturalWidth / img.naturalHeight;
    setAspectRatio(ratio);
    
    if (!element.styles.naturalWidth && onUpdate) {
      onUpdate({
        styles: {
          ...element.styles,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
        }
      });
    }

    // Set initial dimensions if not set
    if (!element.styles.width || element.styles.width === '100%') {
      const containerWidth = containerRef.current?.parentElement?.clientWidth || 400;
      const initialWidth = Math.min(img.naturalWidth, containerWidth);
      const initialHeight = initialWidth / ratio;
      setDimensions({ width: initialWidth, height: initialHeight });
    }
  }, [element.styles, onUpdate]);

  // Sync dimensions from props
  useEffect(() => {
    if (element.styles.width && element.styles.width !== '100%') {
      const w = parseInt(element.styles.width);
      const h = element.styles.height && element.styles.height !== 'auto' 
        ? parseInt(element.styles.height) 
        : w / aspectRatio;
      if (!isNaN(w)) {
        setDimensions({ width: w, height: h || w / aspectRatio });
      }
    }
  }, [element.styles.width, element.styles.height, aspectRatio]);

  const handleMouseDown = useCallback((e: React.MouseEvent, handle: ResizeHandle) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setActiveHandle(handle);
    startPos.current = {
      x: e.clientX,
      y: e.clientY,
      width: dimensions.width,
      height: dimensions.height,
    };
  }, [dimensions]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !activeHandle) return;

    const deltaX = e.clientX - startPos.current.x;
    const deltaY = e.clientY - startPos.current.y;
    
    let newWidth = startPos.current.width;
    let newHeight = startPos.current.height;

    // Calculate new dimensions based on handle
    switch (activeHandle) {
      case 'se':
        newWidth = Math.max(50, startPos.current.width + deltaX);
        newHeight = isLocked ? newWidth / aspectRatio : Math.max(50, startPos.current.height + deltaY);
        break;
      case 'sw':
        newWidth = Math.max(50, startPos.current.width - deltaX);
        newHeight = isLocked ? newWidth / aspectRatio : Math.max(50, startPos.current.height + deltaY);
        break;
      case 'ne':
        newWidth = Math.max(50, startPos.current.width + deltaX);
        newHeight = isLocked ? newWidth / aspectRatio : Math.max(50, startPos.current.height - deltaY);
        break;
      case 'nw':
        newWidth = Math.max(50, startPos.current.width - deltaX);
        newHeight = isLocked ? newWidth / aspectRatio : Math.max(50, startPos.current.height - deltaY);
        break;
      case 'e':
        newWidth = Math.max(50, startPos.current.width + deltaX);
        if (isLocked) newHeight = newWidth / aspectRatio;
        break;
      case 'w':
        newWidth = Math.max(50, startPos.current.width - deltaX);
        if (isLocked) newHeight = newWidth / aspectRatio;
        break;
      case 'n':
        newHeight = Math.max(50, startPos.current.height - deltaY);
        if (isLocked) newWidth = newHeight * aspectRatio;
        break;
      case 's':
        newHeight = Math.max(50, startPos.current.height + deltaY);
        if (isLocked) newWidth = newHeight * aspectRatio;
        break;
    }

    setDimensions({ width: Math.round(newWidth), height: Math.round(newHeight) });
  }, [isResizing, activeHandle, isLocked, aspectRatio]);

  const handleMouseUp = useCallback(() => {
    if (isResizing && onUpdate) {
      onUpdate({
        styles: {
          ...element.styles,
          width: `${dimensions.width}px`,
          height: `${dimensions.height}px`,
        }
      });
    }
    setIsResizing(false);
    setActiveHandle(null);
  }, [isResizing, dimensions, element.styles, onUpdate]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const handleStyle: React.CSSProperties = {
    position: 'absolute',
    width: '12px',
    height: '12px',
    backgroundColor: 'hsl(var(--primary))',
    border: '2px solid white',
    borderRadius: '2px',
    zIndex: 50,
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  };

  const sideHandleStyle: React.CSSProperties = {
    ...handleStyle,
    width: '8px',
    height: '24px',
    borderRadius: '4px',
  };

  const topBottomHandleStyle: React.CSSProperties = {
    ...handleStyle,
    width: '24px',
    height: '8px',
    borderRadius: '4px',
  };

  const containerStyles: React.CSSProperties = {
    width: dimensions.width > 0 ? `${dimensions.width}px` : element.styles.width || '100%',
    height: dimensions.height > 0 ? `${dimensions.height}px` : 'auto',
    borderRadius: element.styles.borderRadius,
    padding: element.styles.padding,
    margin: element.styles.margin,
    position: 'relative',
    display: 'inline-block',
  };

  const wrapperStyles: React.CSSProperties = {
    textAlign: (element.styles.textAlign as React.CSSProperties['textAlign']) || 'center',
  };

  if (!element.content.src) {
    return (
      <div style={wrapperStyles}>
        <div 
          style={{ ...containerStyles, width: '100%', height: 'auto' }}
          className="flex flex-col items-center justify-center bg-muted/50 border-2 border-dashed border-muted-foreground/30 rounded-lg py-12"
        >
          <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
          <span className="text-sm text-muted-foreground mt-2">Adicione uma URL de imagem</span>
        </div>
      </div>
    );
  }

  return (
    <div style={wrapperStyles}>
      <div
        ref={containerRef}
        style={containerStyles}
        className={cn(
          'relative group',
          isResizing && 'select-none'
        )}
      >
        <img
          ref={imageRef}
          src={element.content.src}
          alt="Imagem"
          onLoad={handleImageLoad}
          className="w-full h-full object-cover"
          style={{ borderRadius: element.styles.borderRadius }}
          draggable={false}
        />

        {/* Resize Handles - Only show when selected */}
        {isSelected && (
          <>
            {/* Dimension indicator */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-primary text-primary-foreground text-xs font-mono rounded shadow-lg whitespace-nowrap flex items-center gap-2">
              <span>{dimensions.width} × {dimensions.height}px</span>
              {isLocked ? (
                <Lock className="w-3 h-3" />
              ) : (
                <Unlock className="w-3 h-3" />
              )}
            </div>

            {/* Corner handles */}
            <div
              style={{ ...handleStyle, top: '-6px', left: '-6px', cursor: 'nwse-resize' }}
              onMouseDown={(e) => handleMouseDown(e, 'nw')}
            />
            <div
              style={{ ...handleStyle, top: '-6px', right: '-6px', cursor: 'nesw-resize' }}
              onMouseDown={(e) => handleMouseDown(e, 'ne')}
            />
            <div
              style={{ ...handleStyle, bottom: '-6px', left: '-6px', cursor: 'nesw-resize' }}
              onMouseDown={(e) => handleMouseDown(e, 'sw')}
            />
            <div
              style={{ ...handleStyle, bottom: '-6px', right: '-6px', cursor: 'nwse-resize' }}
              onMouseDown={(e) => handleMouseDown(e, 'se')}
            />

            {/* Side handles */}
            <div
              style={{ 
                ...sideHandleStyle, 
                top: '50%', 
                left: '-4px', 
                transform: 'translateY(-50%)',
                cursor: 'ew-resize' 
              }}
              onMouseDown={(e) => handleMouseDown(e, 'w')}
            />
            <div
              style={{ 
                ...sideHandleStyle, 
                top: '50%', 
                right: '-4px', 
                transform: 'translateY(-50%)',
                cursor: 'ew-resize' 
              }}
              onMouseDown={(e) => handleMouseDown(e, 'e')}
            />
            <div
              style={{ 
                ...topBottomHandleStyle, 
                top: '-4px', 
                left: '50%', 
                transform: 'translateX(-50%)',
                cursor: 'ns-resize' 
              }}
              onMouseDown={(e) => handleMouseDown(e, 'n')}
            />
            <div
              style={{ 
                ...topBottomHandleStyle, 
                bottom: '-4px', 
                left: '50%', 
                transform: 'translateX(-50%)',
                cursor: 'ns-resize' 
              }}
              onMouseDown={(e) => handleMouseDown(e, 's')}
            />

            {/* Selection border */}
            <div 
              className="absolute inset-0 border-2 border-primary pointer-events-none rounded-[inherit]"
              style={{ borderRadius: element.styles.borderRadius }}
            />
          </>
        )}
      </div>
    </div>
  );
}
