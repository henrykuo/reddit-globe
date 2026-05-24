import { describe, it, expect } from 'vitest';
import { render, waitFor, act } from '@testing-library/react';
import { createRef } from 'react';
import EarthGlobe from './EarthGlobe';
import type { EarthGlobeRef } from './types';

/**
 * Ref API Tests for EarthGlobe Component
 * 
 * Tests the imperative handle exposed via ref for programmatic control
 * of the globe's camera and rotation state.
 * 
 * Validates Requirements: 9.4, 7.5
 */
describe('EarthGlobe - Ref API', () => {
  it('exposes ref API methods', async () => {
    const ref = createRef<EarthGlobeRef>();
    render(<EarthGlobe ref={ref} />);
    
    // Wait for the component to fully mount and ref to be set
    await waitFor(() => {
      expect(ref.current).not.toBeNull();
    });
    
    // Verify all required methods are exposed
    expect(ref.current).toBeDefined();
    expect(ref.current).toHaveProperty('resetView');
    expect(ref.current).toHaveProperty('setCameraPosition');
    expect(ref.current).toHaveProperty('toggleAutoRotation');
    
    // Verify methods are functions
    expect(typeof ref.current?.resetView).toBe('function');
    expect(typeof ref.current?.setCameraPosition).toBe('function');
    expect(typeof ref.current?.toggleAutoRotation).toBe('function');
  });
  
  it('resetView method can be called without errors', async () => {
    const ref = createRef<EarthGlobeRef>();
    render(<EarthGlobe ref={ref} />);
    
    // Wait for ref to be set
    await waitFor(() => {
      expect(ref.current).not.toBeNull();
    });
    
    // Should not throw when called
    expect(() => {
      ref.current?.resetView();
    }).not.toThrow();
  });
  
  it('setCameraPosition method can be called with valid position', async () => {
    const ref = createRef<EarthGlobeRef>();
    render(<EarthGlobe ref={ref} />);
    
    // Wait for ref to be set
    await waitFor(() => {
      expect(ref.current).not.toBeNull();
    });
    
    // Should not throw when called with valid position
    expect(() => {
      ref.current?.setCameraPosition([1, 2, 3]);
    }).not.toThrow();
  });
  
  it('toggleAutoRotation method can be called with boolean values', async () => {
    const ref = createRef<EarthGlobeRef>();
    render(<EarthGlobe ref={ref} />);
    
    // Wait for ref to be set
    await waitFor(() => {
      expect(ref.current).not.toBeNull();
    });
    
    // Should not throw when called with true
    expect(() => {
      act(() => {
        ref.current?.toggleAutoRotation(true);
      });
    }).not.toThrow();
    
    // Should not throw when called with false
    expect(() => {
      act(() => {
        ref.current?.toggleAutoRotation(false);
      });
    }).not.toThrow();
  });
  
  it('ref methods work when component is mounted', async () => {
    const ref = createRef<EarthGlobeRef>();
    const { unmount } = render(<EarthGlobe ref={ref} />);
    
    // Wait for ref to be set
    await waitFor(() => {
      expect(ref.current).not.toBeNull();
    });
    
    // All methods should be callable
    act(() => {
      ref.current?.resetView();
      ref.current?.setCameraPosition([0, 0, 5]);
      ref.current?.toggleAutoRotation(false);
      ref.current?.toggleAutoRotation(true);
    });
    
    // Cleanup
    unmount();
  });
  
  it('forwards ref from EarthGlobe to Earth component', async () => {
    const ref = createRef<EarthGlobeRef>();
    render(<EarthGlobe ref={ref} />);
    
    // Wait for ref to be set
    await waitFor(() => {
      expect(ref.current).not.toBeNull();
    });
    
    // If ref is properly forwarded, it should have the imperative handle
    expect(ref.current).not.toBeNull();
    expect(ref.current).toHaveProperty('resetView');
  });
});
