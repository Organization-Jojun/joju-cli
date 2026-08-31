import CopyCommand from './CopyCommand';
import Glass from './Glass';
import { installers } from '@/data/site';

export function InstallCards() {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(340px,1fr))] gap-[18px]">
      {installers.map((i) => (
        <Glass
          key={i.id}
          borderRadius={12}
          width="100%"
          height="auto"
          className="overflow-hidden shadow-[0_16px_50px_rgba(0,0,0,0.4)]"
          data-anim="install-card"
        >
          <article>
            <header className="flex h-[34px] items-center justify-between px-3">
              <h3 className="text-[12px] font-normal text-[#f2f2f5]/50">{i.platform}</h3>
              <span className="font-mono text-[10.5px] text-[#f2f2f5]/30">{i.arch}</span>
            </header>

            <div className="border-t border-white/[0.09] bg-black/40 px-3 pt-3 pb-3.5 font-mono text-[12.5px] leading-[1.5]">
              <p className="m-0 break-all">
                <span className="select-none text-[#f0b862]">$ </span>
                <span className="text-[#f2f2f5]">{i.command}</span>
              </p>
              <p className="mt-[7px] mb-0 text-[11.5px] text-[#f2f2f5]/40">{i.note}</p>
            </div>

            <footer className="flex items-center justify-end border-t border-white/[0.09] bg-white/[0.03] px-2 py-[7px]">
              <CopyCommand command={i.command} />
            </footer>
          </article>
        </Glass>
      ))}
    </div>
  );
}

export default InstallCards;
