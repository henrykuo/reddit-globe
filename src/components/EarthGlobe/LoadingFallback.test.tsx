import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingFallback from './LoadingFallback';

describe('LoadingFallback Component - Accessibility', () => {
  it('has role="status" for screen readers', () => {
    render(<LoadingFallback />);
    const loadingRegion = screen.getByRole('status');
    expect(loadingRegion).toBeInTheDocument();
  });

  it('has aria-live="polite" for loading announcements', () => {
    render(<LoadingFallback />);
    const loadingRegion = screen.getByRole('status');
    expect(loadingRegion).toHaveAttribute('aria-live', 'polite');
  });

  it('has aria-label describing the loading state', () => {
    render(<LoadingFallback />);
    const loadingRegion = screen.getByRole('status');
    expect(loadingRegion).toHaveAttribute('aria-label', 'Loading 3D Earth globe');
  });

  it('displays loading text', () => {
    render(<LoadingFallback />);
    expect(screen.getByText(/Loading Earth Globe/i)).toBeInTheDocument();
  });

  it('has all required accessibility attributes together', () => {
    const { container } = render(<LoadingFallback />);
    const loadingRegion = container.querySelector('[role="status"][aria-live="polite"][aria-label]');
    expect(loadingRegion).toBeInTheDocument();
    expect(loadingRegion).toHaveAttribute('aria-label', 'Loading 3D Earth globe');
  });
});
