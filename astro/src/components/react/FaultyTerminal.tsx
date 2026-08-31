import { useEffect, useMemo, useRef } from 'react';
import { fragmentShader, vertexShader } from './faulty-terminal.shader';

export interface FaultyTerminalProps {
  scale?: number;
  gridMul?: [number, number];
  digitSize?: number;
  timeScale?: number;
  scanlineIntensity?: number;
  glitchAmount?: number;
  flickerAmount?: number;
  noiseAmp?: number;
  curvature?: number;
  tint?: string;
  mouseReact?: boolean;
  mouseStrength?: number;
  brightness?: number;
  className?: string;
}

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h.slice(0, 6), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/**
 * Prompt-noise WebGL backdrop (React Bits "FaultyTerminal", trimmed to the props we use).
 * ogl is dynamically imported so the hero can paint before WebGL code downloads.
 */
export function FaultyTerminal({
  scale = 1.7,
  gridMul = [2, 1],
  digitSize = 1.25,
  timeScale = 0.35,
  scanlineIntensity = 0.55,
  glitchAmount = 1,
  flickerAmount = 1,
  noiseAmp = 1,
  curvature = 0.12,
  tint = '#7c8cff',
  mouseReact = true,
  mouseStrength = 0.32,
  brightness = 0.95,
  className = ''
}: FaultyTerminalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: 0.5, y: 0.5 });
  const smooth = useRef({ x: 0.5, y: 0.5 });
  const tintVec = useMemo(() => hexToRgb(tint), [tint]);

  useEffect(() => {
    const ctn = ref.current;
    if (!ctn) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let cancelled = false;
    let raf = 0;
    let ro: ResizeObserver | undefined;
    let onMove: ((e: MouseEvent) => void) | undefined;
    let onVisibility: (() => void) | undefined;
    let gl: WebGLRenderingContext | WebGL2RenderingContext | undefined;

    void (async () => {
      const { Renderer, Program, Mesh, Color, Triangle } = await import('ogl');
      if (cancelled || !ref.current) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const renderer = new Renderer({ dpr });
      gl = renderer.gl;
      gl.clearColor(0, 0, 0, 1);

      const resolution = new Color(gl.canvas.width, gl.canvas.height, 1);
      const program = new Program(gl, {
        vertex: vertexShader,
        fragment: fragmentShader,
        uniforms: {
          iTime: { value: 0 },
          iResolution: { value: resolution },
          uScale: { value: scale },
          uGridMul: { value: new Float32Array(gridMul) },
          uDigitSize: { value: digitSize },
          uScanlineIntensity: { value: scanlineIntensity },
          uGlitchAmount: { value: glitchAmount },
          uFlickerAmount: { value: flickerAmount },
          uNoiseAmp: { value: noiseAmp },
          uChromaticAberration: { value: 0 },
          uDither: { value: 0 },
          uCurvature: { value: curvature },
          uTint: { value: new Color(...tintVec) },
          uMouse: { value: new Float32Array([0.5, 0.5]) },
          uMouseStrength: { value: mouseStrength },
          uUseMouse: { value: mouseReact ? 1 : 0 },
          uPageLoadProgress: { value: 0 },
          uUsePageLoadAnimation: { value: 1 },
          uBrightness: { value: brightness }
        }
      });

      const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

      const resize = () => {
        renderer.setSize(ctn.offsetWidth, ctn.offsetHeight);
        resolution.r = gl!.canvas.width;
        resolution.g = gl!.canvas.height;
        resolution.b = gl!.canvas.width / gl!.canvas.height;
      };

      ro = new ResizeObserver(resize);
      ro.observe(ctn);
      resize();
      ctn.appendChild(gl.canvas);

      onMove = (e: MouseEvent) => {
        const r = ctn.getBoundingClientRect();
        mouse.current = { x: (e.clientX - r.left) / r.width, y: 1 - (e.clientY - r.top) / r.height };
      };
      if (mouseReact) ctn.addEventListener('mousemove', onMove);

      let start = 0;
      let paused = false;
      const offset = Math.random() * 100;

      onVisibility = () => {
        paused = document.hidden;
      };
      document.addEventListener('visibilitychange', onVisibility);

      const loop = (t: number) => {
        raf = requestAnimationFrame(loop);
        if (paused) return;
        if (!start) {
          start = t;
          ctn.dataset.glReady = 'true';
        }
        program.uniforms.iTime.value = (t * 0.001 + offset) * timeScale;
        program.uniforms.uPageLoadProgress.value = Math.min((t - start) / 1800, 1);
        smooth.current.x += (mouse.current.x - smooth.current.x) * 0.08;
        smooth.current.y += (mouse.current.y - smooth.current.y) * 0.08;
        program.uniforms.uMouse.value[0] = smooth.current.x;
        program.uniforms.uMouse.value[1] = smooth.current.y;
        renderer.render({ scene: mesh });
      };
      raf = requestAnimationFrame(loop);
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro?.disconnect();
      if (onMove && mouseReact) ctn.removeEventListener('mousemove', onMove);
      if (onVisibility) document.removeEventListener('visibilitychange', onVisibility);
      const canvas = ctn.querySelector('canvas');
      if (canvas && canvas.parentElement === ctn) ctn.removeChild(canvas);
      delete ctn.dataset.glReady;
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, [
    scale, gridMul, digitSize, timeScale, scanlineIntensity, glitchAmount,
    flickerAmount, noiseAmp, curvature, tintVec, mouseReact, mouseStrength, brightness
  ]);

  return <div ref={ref} className={`relative h-full w-full overflow-hidden ${className}`} />;
}

export default FaultyTerminal;
