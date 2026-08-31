import { useRef, useEffect, useCallback, type CSSProperties, type MouseEvent } from 'react';
import './MagicBento.css';

export interface BentoItem {
  label: string;
  title: string;
  description?: string;
}

export interface MagicBentoProps {
  items: BentoItem[];
  layout?: 'stack' | 'principles';
  enableBorderGlow?: boolean;
  glowColor?: string;
  glowRadius?: number;
  /** Per-card data attribute for scroll animations */
  itemAnimAttr?: string;
}

const MOBILE_BREAKPOINT = 768;

function updateCardGlow(
  card: HTMLElement,
  mouseX: number,
  mouseY: number,
  intensity: number,
  radius: number
) {
  const rect = card.getBoundingClientRect();
  const relativeX = ((mouseX - rect.left) / rect.width) * 100;
  const relativeY = ((mouseY - rect.top) / rect.height) * 100;
  card.style.setProperty('--glow-x', `${relativeX}%`);
  card.style.setProperty('--glow-y', `${relativeY}%`);
  card.style.setProperty('--glow-intensity', intensity.toString());
  card.style.setProperty('--glow-radius', `${radius}px`);
}

function BentoCard({
  item,
  enableBorderGlow,
  glowRadius,
  animAttr
}: {
  item: BentoItem;
  enableBorderGlow: boolean;
  glowRadius: number;
  animAttr?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  const onMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!enableBorderGlow || !cardRef.current) return;
      updateCardGlow(cardRef.current, e.clientX, e.clientY, 1, glowRadius);
    },
    [enableBorderGlow, glowRadius]
  );

  const onMouseLeave = useCallback(() => {
    cardRef.current?.style.setProperty('--glow-intensity', '0');
  }, []);

  const className = [
    'magic-bento-card',
    enableBorderGlow ? 'magic-bento-card--border-glow' : ''
  ]
    .filter(Boolean)
    .join(' ');

  const style = {
    '--glow-color': '124, 140, 255'
  } as CSSProperties;

  return (
    <div
      ref={cardRef}
      className={className}
      style={style}
      data-anim={animAttr}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {item.label ? (
        <div className="magic-bento-card__header">
          <div className="magic-bento-card__label">{item.label}</div>
        </div>
      ) : null}
      <div className="magic-bento-card__content">
        <h3 className="magic-bento-card__title">{item.title}</h3>
        {item.description ? (
          <p className="magic-bento-card__description">{item.description}</p>
        ) : null}
      </div>
    </div>
  );
}

export function MagicBento({
  items,
  layout = 'stack',
  enableBorderGlow = true,
  glowColor = '124, 140, 255',
  glowRadius = 140,
  itemAnimAttr
}: MagicBentoProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth <= MOBILE_BREAKPOINT) {
        gridRef.current?.querySelectorAll('.magic-bento-card').forEach((card) => {
          (card as HTMLElement).style.setProperty('--glow-intensity', '0');
        });
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div
      className={`card-grid card-grid--${layout} bento-section`}
      ref={gridRef}
      style={{ '--glow-color': glowColor } as CSSProperties}
    >
      {items.map((item, index) => (
        <BentoCard
          key={`${item.label}-${index}`}
          item={item}
          enableBorderGlow={enableBorderGlow}
          glowRadius={glowRadius}
          animAttr={itemAnimAttr}
        />
      ))}
    </div>
  );
}

export default MagicBento;
