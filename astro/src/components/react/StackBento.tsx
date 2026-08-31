import { stack } from '@/data/site';
import MagicBento from './MagicBento';

export function StackBento() {
  const items = stack.map((s) => ({
    label: s.label,
    title: s.value
  }));

  return (
    <MagicBento
      layout="stack"
      items={items}
      enableBorderGlow
      glowColor="124, 140, 255"
      itemAnimAttr="stack-item"
    />
  );
}

export default StackBento;
