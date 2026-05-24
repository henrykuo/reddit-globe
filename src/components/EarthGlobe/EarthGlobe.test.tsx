import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EarthGlobe from './EarthGlobe';

describe('EarthGlobe Component - Basic Rendering', () => {
  it('renders without crashing', () => {
    render(<EarthGlobe />);
    // Check for the ARIA label
    const globe = screen.getByRole('img', { name: /Interactive 3D Earth globe/i });
    expect(globe).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<EarthGlobe className="custom-test-class" />);
    expect(container.firstChild).toHaveClass('custom-test-class');
  });

  it('renders with default props', () => {
    const { container } = render(<EarthGlobe />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });
  
  it('accepts initialZoom prop', () => {
    // Should not throw when initialZoom is provided
    expect(() => {
      render(<EarthGlobe initialZoom={3} />);
    }).not.toThrow();
  });
  
  it('accepts initialCameraPosition prop', () => {
    // Should not throw when initialCameraPosition is provided
    expect(() => {
      render(<EarthGlobe initialCameraPosition={[1, 2, 3]} />);
    }).not.toThrow();
  });
  
  it('accepts backgroundColor prop', () => {
    // Should not throw when backgroundColor is provided
    expect(() => {
      render(<EarthGlobe backgroundColor="#123456" />);
    }).not.toThrow();
  });
  
  it('accepts disableAutoRotation prop', () => {
    // Should not throw when disableAutoRotation is provided
    expect(() => {
      render(<EarthGlobe disableAutoRotation={true} />);
    }).not.toThrow();
  });
});

describe('EarthGlobe Component - Accessibility', () => {
  it('has aria-label describing the 3D globe', () => {
    render(<EarthGlobe />);
    const globe = screen.getByRole('img', { name: /Interactive 3D Earth globe/i });
    expect(globe).toHaveAttribute('aria-label', 'Interactive 3D Earth globe');
  });

  it('has role="img" for screen readers', () => {
    const { container } = render(<EarthGlobe />);
    const globeContainer = container.querySelector('[role="img"]');
    expect(globeContainer).toBeInTheDocument();
    expect(globeContainer).toHaveAttribute('role', 'img');
  });

  it('container has proper accessibility structure', () => {
    const { container } = render(<EarthGlobe />);
    
    // Verify the main container has both role and aria-label
    const globeContainer = container.querySelector('[role="img"][aria-label]');
    expect(globeContainer).toBeInTheDocument();
    expect(globeContainer).toHaveAttribute('aria-label', 'Interactive 3D Earth globe');
    
    // Note: The loading state (with aria-live="polite" and role="status") 
    // is rendered by LoadingFallback component during texture loading.
    // It's transient and may not be visible after the texture loads quickly in tests.
    // The LoadingFallback component is tested separately to verify it has proper
    // aria-live and role attributes.
  });
});
