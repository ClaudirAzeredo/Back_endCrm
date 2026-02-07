import { BuilderElement } from '@/lib/types/builder-types';

interface Props {
  element: BuilderElement;
}

export function ParagraphElement({ element }: Props) {
  const styles: React.CSSProperties = {
    fontSize: element.styles.fontSize,
    fontWeight: element.styles.fontWeight as React.CSSProperties['fontWeight'],
    textAlign: element.styles.textAlign,
    color: element.styles.color,
    padding: element.styles.padding,
    margin: element.styles.margin,
    overflowWrap: 'anywhere',
  };

  return (
    <p style={styles} className="w-full whitespace-pre-wrap break-words">
      {element.content.text || 'Parágrafo de texto'}
    </p>
  );
}
