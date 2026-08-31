/* Shader entry point for <FaultyTerminal />. GLSL lives in its own files so the component stays readable. */
export { fragmentShader } from './faulty-terminal.frag';

export const vertexShader = /* glsl */ `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;
