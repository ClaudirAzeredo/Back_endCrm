import { BuilderElement } from '@/lib/types/builder-types';

interface Props {
  element: BuilderElement;
}

export function ButtonElement({ element }: Props) {
  const styles: React.CSSProperties = {
    backgroundColor: element.styles.backgroundColor,
    color: element.styles.color,
    fontSize: element.styles.fontSize,
    fontWeight: element.styles.fontWeight as React.CSSProperties['fontWeight'],
    padding: element.styles.padding,
    borderRadius: element.styles.borderRadius,
    display: 'inline-block',
    textDecoration: 'none',
    cursor: 'pointer',
    border: 'none',
    textAlign: element.styles.textAlign,
  };

  return (
    <div style={{ textAlign: element.styles.textAlign }} className="w-full">
      <button style={styles} onClick={(e) => e.preventDefault()}>
        {element.content.buttonText || 'Botão'}
      </button>
    </div>
  );
}
