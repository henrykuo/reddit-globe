import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Mock ResizeObserver for jsdom
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

(globalThis as any).ResizeObserver = ResizeObserverMock;

// Mock WebGL context for Three.js
const mockWebGLContext = {
  canvas: null as HTMLCanvasElement | null, // Will be set dynamically
  drawingBufferWidth: 800,
  drawingBufferHeight: 600,
  getExtension: () => null,
  getParameter: () => null,
  getShaderPrecisionFormat: () => ({
    precision: 1,
    rangeMin: 1,
    rangeMax: 1,
  }),
  createShader: () => ({}),
  shaderSource: () => {},
  compileShader: () => {},
  getShaderParameter: () => true,
  createProgram: () => ({}),
  attachShader: () => {},
  linkProgram: () => {},
  getProgramParameter: () => true,
  useProgram: () => {},
  createBuffer: () => ({}),
  bindBuffer: () => {},
  bufferData: () => {},
  enable: () => {},
  disable: () => {},
  clear: () => {},
  clearColor: () => {},
  viewport: () => {},
  getUniformLocation: () => ({}),
  getAttribLocation: () => 0,
  enableVertexAttribArray: () => {},
  vertexAttribPointer: () => {},
  drawArrays: () => {},
  drawElements: () => {},
  createTexture: () => ({}),
  bindTexture: () => {},
  texImage2D: () => {},
  texParameteri: () => {},
  generateMipmap: () => {},
  activeTexture: () => {},
  uniform1i: () => {},
  uniform1f: () => {},
  uniform2f: () => {},
  uniform3f: () => {},
  uniform4f: () => {},
  uniformMatrix4fv: () => {},
};

const originalGetContext = HTMLCanvasElement.prototype.getContext;
(HTMLCanvasElement.prototype.getContext as any) = function (this: HTMLCanvasElement, contextType: string) {
  if (contextType === 'webgl' || contextType === 'webgl2') {
    // Set the canvas reference to the actual canvas element
    mockWebGLContext.canvas = this;
    return mockWebGLContext as any;
  }
  return originalGetContext.call(this, contextType as any);
};

// Cleanup after each test
afterEach(() => {
  cleanup();
});
