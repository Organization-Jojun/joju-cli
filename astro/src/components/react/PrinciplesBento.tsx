import { principles } from '@/data/site';
import MagicBento from './MagicBento';

export function PrinciplesBento() {
  const items = principles.map((p) => ({
    label: '',
    title: p.title,
    description: p.body
  }));

  return (
    <MagicBento
      layout="principles"
      items={items}
      enableBorderGlow
      glowColor="124, 140, 255"
      itemAnimAttr="why-card"
    />
  );
}

export default PrinciplesBento;
