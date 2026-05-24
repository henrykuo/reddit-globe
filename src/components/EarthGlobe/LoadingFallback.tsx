/**
 * LoadingFallback - Loading indicator for the Earth globe
 * Displays a spinner and accessible loading text while the 3D globe texture loads
 */
export default function LoadingFallback() {
  return (
    <div 
      className="flex items-center justify-center w-full h-full"
      role="status"
      aria-live="polite"
      aria-label="Loading 3D Earth globe"
    >
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
        
        {/* Loading text */}
        <p className="text-gray-400 text-sm font-medium">
          Loading Earth Globe...
        </p>
      </div>
    </div>
  );
}
