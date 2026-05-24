// WebGLErrorBoundary tests
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeAll, afterAll } from 'vitest';
import WebGLErrorBoundary from './WebGLErrorBoundary';

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('WebGL initialization failed');
  }
  return <div>Content</div>;
}

describe('WebGLErrorBoundary', () => {
  // Suppress console.error for these tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = vi.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when no error occurs', () => {
    render(
      <WebGLErrorBoundary>
        <ThrowError shouldThrow={false} />
      </WebGLErrorBoundary>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('displays fallback UI when error occurs', () => {
    render(
      <WebGLErrorBoundary>
        <ThrowError shouldThrow={true} />
      </WebGLErrorBoundary>
    );

    expect(screen.getByText('WebGL Not Supported')).toBeInTheDocument();
    expect(screen.getByText(/Your browser doesn't support WebGL/i)).toBeInTheDocument();
  });

  it('displays custom fallback when provided', () => {
    const customFallback = <div>Custom Error Message</div>;

    render(
      <WebGLErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </WebGLErrorBoundary>
    );

    expect(screen.getByText('Custom Error Message')).toBeInTheDocument();
    expect(screen.queryByText('WebGL Not Supported')).not.toBeInTheDocument();
  });

  it('logs error to console when error occurs', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error');

    render(
      <WebGLErrorBoundary>
        <ThrowError shouldThrow={true} />
      </WebGLErrorBoundary>
    );

    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('includes browser upgrade instructions in fallback', () => {
    render(
      <WebGLErrorBoundary>
        <ThrowError shouldThrow={true} />
      </WebGLErrorBoundary>
    );

    expect(screen.getByText(/Chrome, Firefox, Safari, or Edge/i)).toBeInTheDocument();
  });
});
