// WebGLErrorBoundary - Error boundary for WebGL initialization errors
import { Component, type ReactNode } from 'react';

interface WebGLErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface WebGLErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component that catches WebGL initialization errors
 * and displays a user-friendly fallback message.
 */
export default class WebGLErrorBoundary extends Component<
  WebGLErrorBoundaryProps,
  WebGLErrorBoundaryState
> {
  constructor(props: WebGLErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): WebGLErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details to console for debugging
    console.error('WebGL Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="flex items-center justify-center h-full bg-gray-900 text-white p-6">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-bold mb-4">WebGL Not Supported</h2>
            <p className="text-gray-400 mb-4">
              Your browser doesn't support WebGL or it's disabled.
              The 3D Earth globe requires WebGL to function properly.
            </p>
            <p className="text-gray-500 text-sm">
              Please try using a modern browser like Chrome, Firefox, Safari, or Edge.
              If you're already using one of these browsers, make sure WebGL is enabled in your settings.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
