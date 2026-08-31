import Glass from './Glass';

export function HeroCtaGlass() {
  return (
    <Glass borderRadius={16} className="inline-flex shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
      <a
        href="#instalacion"
        className="inline-flex h-[52px] items-center px-[22px] text-[14.5px] text-[#f2f2f5]/78 transition-colors hover:text-white"
      >
        Windows y macOS / Linux
      </a>
    </Glass>
  );
}
