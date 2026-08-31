# jojun-web

Landing de [Jojun](https://github.com/Organization-Jojun/joju-cli) — Astro 5 + islas de React 19 + Tailwind 4 + GSAP.

## Estructura

```
src/
  data/            fuente única de contenido (site.ts, session.ts) — nada de copy hardcodeado en JSX
  layouts/         BaseLayout.astro: <head>, SEO, JSON-LD, fuentes
  pages/           index.astro compone secciones y arranca la animación
  components/
    layout/        Nav, SiteFooter
    sections/      una sección = un archivo (Hero, Principles, SessionDemo, Install, Stack)
    ui/            piezas reutilizables sin estado (SectionHeading, TerminalCard)
    react/         SOLO lo que necesita JS en el cliente (FaultyTerminal, CopyCommand)
  scripts/motion.ts  todos los ScrollTrigger en un único punto de entrada
  styles/global.css  tokens de Tailwind 4 (@theme) + utilidad .glass + keyframes
```

Regla: **Astro por defecto, React solo como isla.** Hoy hay dos islas —
`<FaultyTerminal client:visible />` (WebGL, se monta al entrar en viewport) y
`<CopyCommand client:idle />` (botón Copy). Todo lo demás es HTML estático.

## Desarrollo local

```bash
npm install
npm run dev
```

El GLSL ya está en `src/components/react/faulty-terminal.frag.ts`; `faulty-terminal.shader.ts`
lo reexporta junto al vertex shader.

## Cloudflare Pages

Copia esta carpeta dentro de tu monorepo (por ejemplo `frontend/` o `web/`) y apunta Cloudflare a ella:

| Campo | Valor |
| --- | --- |
| Framework preset | None |
| Root directory | `astro` (o la ruta donde copies esta carpeta) |
| Build command | `npm install && npm run build` |
| Build output directory | `dist` |
| Node.js version | `20` |

La imagen Open Graph (`public/og-image.png`) se genera desde el banner de la CLI antes de cada build (`prebuild`).

## Movimiento

`initMotion()` respeta `prefers-reduced-motion` y usa `gsap.matchMedia()`: el pin de la sección
"Nada que entregar" y el parallax del hero solo existen desde 900px. El scrub de las terminales
ordena las líneas por `data-term-order`, así que A y B se revelan en el orden real del cable.
