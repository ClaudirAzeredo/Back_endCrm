import { BuilderElement } from '@/lib/types/builder-types';

interface Props {
  element: BuilderElement;
}

export function SpacerElement({ element }: Props) {
  const styles: React.CSSProperties = {
    height: element.styles.height || '40px',
  };

  return (
    <div style={styles} className="w-full relative group">
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="border-t-2 border-dashed border-muted-foreground/30 w-full" />
      </div>
    </div>
  );
}
