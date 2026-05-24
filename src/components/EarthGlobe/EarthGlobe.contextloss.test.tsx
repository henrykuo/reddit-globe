// EarthGlobe WebGL context loss tests
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import EarthGlobe from './EarthGlobe';

describe('EarthGlobe - WebGL Context Loss', () => {
  it('displays context lost message when webglcontextlost event fires', async () => {
    const { container } = render(<EarthGlobe className="w-full h-full" />);

    // Wait for canvas to be created
    await waitFor(() => {
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    const canvas = container.querySelector('canvas');
    if (!canvas) throw new Error('Canvas not found');

    // Wait significantly longer for onCreated callback to attach event listeners
    // React Three Fiber calls onCreated asynchronously after WebGL context is initialized
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simulate context lost event
    const contextLostEvent = new Event('webglcontextlost', { cancelable: true });
    canvas.dispatchEvent(contextLostEvent);

    // Check that context lost message is displayed
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('WebGL Context Lost')).toBeInTheDocument();
      expect(screen.getByText(/memory constraints/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('hides context lost message when webglcontextrestored event fires', async () => {
    const { container } = render(<EarthGlobe className="w-full h-full" />);

    // Wait for canvas to be created
    await waitFor(() => {
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    const canvas = container.querySelector('canvas');
    if (!canvas) throw new Error('Canvas not found');

    // Wait for onCreated callback to attach event listeners
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simulate context lost event
    const contextLostEvent = new Event('webglcontextlost', { cancelable: true });
    canvas.dispatchEvent(contextLostEvent);

    // Verify message is shown
    await waitFor(() => {
      expect(screen.getByText('WebGL Context Lost')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Simulate context restored event
    const contextRestoredEvent = new Event('webglcontextrestored');
    canvas.dispatchEvent(contextRestoredEvent);

    // Verify message is hidden
    await waitFor(() => {
      expect(screen.queryByText('WebGL Context Lost')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('prevents default behavior on webglcontextlost event', async () => {
    const { container } = render(<EarthGlobe className="w-full h-full" />);

    await waitFor(() => {
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    const canvas = container.querySelector('canvas');
    if (!canvas) throw new Error('Canvas not found');

    // Wait longer for onCreated callback to attach event listeners
    await new Promise(resolve => setTimeout(resolve, 500));

    // Create event with preventDefault spy
    const contextLostEvent = new Event('webglcontextlost', { cancelable: true });
    const preventDefaultSpy = vi.spyOn(contextLostEvent, 'preventDefault');

    canvas.dispatchEvent(contextLostEvent);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('logs warning when context is lost', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn');
    const { container } = render(<EarthGlobe className="w-full h-full" />);

    await waitFor(() => {
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    const canvas = container.querySelector('canvas');
    if (!canvas) throw new Error('Canvas not found');

    // Wait longer for onCreated callback to attach event listeners
    await new Promise(resolve => setTimeout(resolve, 500));

    const contextLostEvent = new Event('webglcontextlost', { cancelable: true });
    canvas.dispatchEvent(contextLostEvent);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('WebGL context lost')
    );
  });

  it('logs message when context is restored', async () => {
    const consoleLogSpy = vi.spyOn(console, 'log');
    const { container } = render(<EarthGlobe className="w-full h-full" />);

    await waitFor(() => {
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeInTheDocument();
    });

    const canvas = container.querySelector('canvas');
    if (!canvas) throw new Error('Canvas not found');

    // Wait longer for onCreated callback to attach event listeners
    await new Promise(resolve => setTimeout(resolve, 500));

    // First lose context
    const contextLostEvent = new Event('webglcontextlost', { cancelable: true });
    canvas.dispatchEvent(contextLostEvent);

    // Then restore it
    const contextRestoredEvent = new Event('webglcontextrestored');
    canvas.dispatchEvent(contextRestoredEvent);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('WebGL context restored')
    );
  });
});
