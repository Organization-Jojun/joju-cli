import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const q = (sel: string) => Array.from(document.querySelectorAll<HTMLElement>(sel));

/** Scroll-linked motion only. Hero intro runs in CSS for faster first paint. */
export function initMotion(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const boot = () => {
    reveals();
    architecture();
    sessionScrub();
    gsap.matchMedia().add('(min-width: 900px)', desktopOnly);
    ScrollTrigger.refresh();
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(boot, { timeout: 1800 });
  } else {
    setTimeout(boot, 120);
  }
}

function reveals() {
  q('[data-anim="reveal"]').forEach((el) =>
    gsap.fromTo(el,
      { y: 44, opacity: 0, filter: 'blur(10px)' },
      { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.2, ease: 'expo.out', overwrite: 'auto',
        scrollTrigger: { trigger: el, start: 'top 82%' } })
  );

  q('[data-anim="term-card"], [data-anim="install-card"]').forEach((el, i) =>
    gsap.fromTo(el,
      { y: 52, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.2, ease: 'expo.out', delay: (i % 2) * 0.1, overwrite: 'auto',
        scrollTrigger: { trigger: el, start: 'top 86%' } })
  );

  gsap.fromTo('[data-anim="stack-item"]',
    { opacity: 0, y: 26 },
    { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.07, overwrite: 'auto',
      scrollTrigger: { trigger: '[data-anim="stack"]', start: 'top 72%' } });

  gsap.fromTo('[data-anim="credit"]',
    { opacity: 0, y: 18 },
    { opacity: 1, y: 0, duration: 0.9, ease: 'expo.out', stagger: 0.09, overwrite: 'auto',
      scrollTrigger: { trigger: '[data-anim="footer"]', start: 'top 88%' } });
}

/** Reveals the two terminals line by line, in wire order, scrubbed to the scroll. */
function sessionScrub() {
  const lines = q('[data-term-line]').sort(
    (a, b) => Number(a.dataset.termOrder) - Number(b.dataset.termOrder)
  );
  if (!lines.length) return;

  gsap
    .timeline({
      scrollTrigger: { trigger: '[data-anim="demo"]', start: 'top 58%', end: 'bottom 92%', scrub: 0.6 }
    })
    .fromTo(lines, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 1, stagger: 0.6, ease: 'none' });
}

/** Arquitectura: reveal corto y encadenado. Sin pin — se dispara una sola vez. */
function architecture() {
  gsap
    .timeline({
      defaults: { ease: 'power3.out', overwrite: 'auto' },
      scrollTrigger: { trigger: '[data-anim="why"]', start: 'top 74%', once: true }
    })
    .fromTo('[data-anim="why-eyebrow"]', { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.4 })
    .fromTo('[data-anim="why-title"]', { yPercent: 105, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.62 }, '-=0.26')
    .fromTo('[data-anim="why-body"]', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.38')
    .fromTo('[data-anim="why-card"]',
      { opacity: 0, y: 30, scale: 0.975, transformPerspective: 800 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.075 }, '-=0.3');
}

/** Solo desktop: el hero se despide y el fondo fijo respira un poco. */
function desktopOnly() {
  const hero = { trigger: '[data-anim="hero"]', start: 'top top', end: 'bottom top', scrub: 0.4 } as const;

  gsap.to('[data-anim="hero-content"]', { yPercent: -16, opacity: 0, filter: 'blur(6px)', ease: 'none', scrollTrigger: hero });
  gsap.to('[data-anim="page-bg"]', { scale: 1.14, ease: 'none', scrollTrigger: { ...hero, scrub: 0.5 } });
}
