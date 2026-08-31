import { site, credits } from '@/data/site';
import Glass from './Glass';

export function FooterGlass() {
  return (
    <div className="flex w-full flex-wrap items-end justify-between gap-8">
      <div>
        <p className="mb-5 text-[13px] text-[#f2f2f5]/40">Desarrollado por</p>
        <ul className="flex flex-wrap gap-2.5">
          {credits.map((credit) => (
            <li key={credit.name} data-anim="credit">
              <Glass borderRadius={16} className="shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                <a
                  href={credit.href}
                  rel="noopener noreferrer"
                  target="_blank"
                  className="block px-5 py-3 text-[15.5px] tracking-[-0.01em] text-[#f2f2f5] transition-colors hover:text-white"
                >
                  {credit.name}
                </a>
              </Glass>
            </li>
          ))}
        </ul>
      </div>

      <Glass borderRadius={9999} className="inline-flex shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        <a
          href={site.repo}
          rel="noopener"
          className="inline-flex items-center gap-2 px-[18px] py-3 font-mono text-[12.5px] text-[#f2f2f5]/70 transition-colors hover:text-white"
        >
          {site.repoLabel}
        </a>
      </Glass>
    </div>
  );
}

export default FooterGlass;
