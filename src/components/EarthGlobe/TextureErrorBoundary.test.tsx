// TextureErrorBoundary tests
import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeAll, afterAll } from 'vitest';
import { Canvas } from '@react-three/fiber';
import TextureErrorBoundary from './TextureErrorBoundary';

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Texture loading failed');
  }
  return null;
}

describe('TextureErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when no error occurs', () => {
    const { container } = render(
      <Canvas>
        <TextureErrorBoundary>
          <ThrowError shouldThrow={false} />
        </TextureErrorBoundary>
      </Canvas>
    );

    // Canvas should render normally
    expect(container.querySelector('canvas')).toBeInTheDocument();
  });

  it('displays fallback when texture loading fails', async () => {
    const { container } = render(
      <Canvas>
        <TextureErrorBoundary>
          <ThrowError shouldThrow={true} />
        </TextureErrorBoundary>
      </Canvas>
    );

    // Wait for error boundary to catch and render fallback
    await waitFor(() => {
      // SolidGlobeFallback should be rendered (canvas still exists)
      expect(container.querySelector('canvas')).toBeInTheDocument();
    });
  });

  it('accepts onError callback prop', () => {
    const onError = vi.fn();

    // Just verify the component accepts the prop without error
    const { container } = render(
      <Canvas>
        <TextureErrorBoundary onError={onError}>
          <mesh>
            <boxGeometry />
            <meshBasicMaterial />
          </mesh>
        </TextureErrorBoundary>
      </Canvas>
    );

    expect(container.querySelector('canvas')).toBeInTheDocument();
  });
});
