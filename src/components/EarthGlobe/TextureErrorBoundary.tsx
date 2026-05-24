// TextureErrorBoundary - Error boundary for texture loading failures
import { Component, type ReactNode } from 'react';
import SolidGlobeFallback from './SolidGlobeFallback';

interface TextureErrorBoundaryProps {
  children: ReactNode;
  onError?: () => void;
}

interface TextureErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component that catches texture loading errors
 * and displays a solid-colored sphere as fallback.
 */
export default class TextureErrorBoundary extends Component<
  TextureErrorBoundaryProps,
  TextureErrorBoundaryState
> {
  constructor(props: TextureErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): TextureErrorBoundaryState {
    console.error('TextureErrorBoundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details to console for debugging
    console.error('Texture Loading Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    
    // Notify parent component
    if (this.props.onError) {
      this.props.onError();
    }
  }

  render() {
    if (this.state.hasError) {
      // Display solid-colored sphere fallback
      return <SolidGlobeFallback />;
    }

    return this.props.children;
  }
}
