import { site } from '@/data/site';
import Glass from './Glass';

export function NavGlass() {
  return (
    <Glass
      borderRadius={9999}
      className="pointer-events-auto shadow-[0_8px_32px_rgba(0,0,0,0.45)]"
      data-anim="nav"
    >
      <div className="flex items-center gap-3.5 px-[18px] py-2.5">
        <span className="font-pixel text-[11px] text-[#f2f2f5]">jojun</span>
        <span className="h-3 w-px bg-white/15" />
        <span className="font-mono text-[11px] text-[#f2f2f5]/40">{site.version}</span>
      </div>
    </Glass>
  );
}

export default NavGlass;
