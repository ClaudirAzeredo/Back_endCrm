import { BuilderElement } from '@/lib/types/builder-types';
import { Play } from 'lucide-react';

interface Props {
  element: BuilderElement;
}

export function VideoElement({ element }: Props) {
  const styles: React.CSSProperties = {
    width: element.styles.width || '100%',
    borderRadius: element.styles.borderRadius,
    padding: element.styles.padding,
    margin: element.styles.margin,
  };

  if (!element.content.videoUrl) {
    return (
      <div 
        style={styles}
        className="flex flex-col items-center justify-center bg-muted/50 border-2 border-dashed border-muted-foreground/30 rounded-lg py-12 aspect-video"
      >
        <Play className="w-12 h-12 text-muted-foreground/50" />
        <span className="text-sm text-muted-foreground mt-2">Adicione uma URL de vídeo</span>
      </div>
    );
  }

  return (
    <div style={styles} className="aspect-video">
      <iframe
        src={element.content.videoUrl}
        className="w-full h-full rounded-lg"
        style={{ borderRadius: element.styles.borderRadius }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
