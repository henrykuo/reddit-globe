/**
 * EarthGlobeExample - Demonstrates various usage patterns for the EarthGlobe component
 * 
 * This example showcases:
 * - Basic usage with default settings
 * - Custom camera positioning
 * - Disabled auto-rotation
 * - Ref API usage for programmatic control
 * - Custom styling and background colors
 * - Loading callbacks
 */

import { useRef, useState } from 'react';
import EarthGlobe from './EarthGlobe';
import type { EarthGlobeRef } from './types';

export default function EarthGlobeExample() {
  const globeRef = useRef<EarthGlobeRef>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [autoRotationEnabled, setAutoRotationEnabled] = useState(true);

  // Handler for reset view button
  const handleResetView = () => {
    globeRef.current?.resetView();
  };

  // Handler for custom camera position
  const handleSetTopView = () => {
    globeRef.current?.setCameraPosition([0, 5, 0]);
  };

  // Handler for toggling auto-rotation
  const handleToggleRotation = () => {
    const newState = !autoRotationEnabled;
    setAutoRotationEnabled(newState);
    globeRef.current?.toggleAutoRotation(newState);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          3D Earth Globe Examples
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Interactive demonstrations of the EarthGlobe component
        </p>

        {/* Example 1: Basic Usage */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            1. Basic Usage
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Default configuration with auto-rotation enabled. Drag to rotate, scroll to zoom.
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="h-96">
              <EarthGlobe className="w-full h-full" />
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700">
              <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
{`<EarthGlobe className="w-full h-full" />`}
              </pre>
            </div>
          </div>
        </section>

        {/* Example 2: Custom Camera Position */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            2. Custom Initial Camera Position
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Start with a custom camera angle showing a specific region.
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="h-96">
              <EarthGlobe
                className="w-full h-full"
                initialCameraPosition={[3, 2, 4]}
              />
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700">
              <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
{`<EarthGlobe
  className="w-full h-full"
  initialCameraPosition={[3, 2, 4]}
/>`}
              </pre>
            </div>
          </div>
        </section>

        {/* Example 3: Custom Zoom Level */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            3. Custom Initial Zoom
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Start with a closer view of the Earth.
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="h-96">
              <EarthGlobe
                className="w-full h-full"
                initialZoom={3}
              />
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700">
              <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
{`<EarthGlobe
  className="w-full h-full"
  initialZoom={3}
/>`}
              </pre>
            </div>
          </div>
        </section>

        {/* Example 4: Disabled Auto-Rotation */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            4. Disabled Auto-Rotation
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Globe remains static until user interacts with it.
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="h-96">
              <EarthGlobe
                className="w-full h-full"
                disableAutoRotation={true}
              />
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700">
              <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
{`<EarthGlobe
  className="w-full h-full"
  disableAutoRotation={true}
/>`}
              </pre>
            </div>
          </div>
        </section>

        {/* Example 5: Custom Background Color */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            5. Custom Background Color
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Use a custom background color for the 3D scene.
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="h-96">
              <EarthGlobe
                className="w-full h-full"
                backgroundColor="#1a1a2e"
              />
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700">
              <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
{`<EarthGlobe
  className="w-full h-full"
  backgroundColor="#1a1a2e"
/>`}
              </pre>
            </div>
          </div>
        </section>

        {/* Example 6: Ref API and Programmatic Control */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            6. Programmatic Control with Ref API
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Use the ref API to control the globe programmatically.
          </p>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
            <div className="h-96">
              <EarthGlobe
                ref={globeRef}
                className="w-full h-full"
                onLoad={() => setIsLoaded(true)}
              />
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 space-y-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleResetView}
                  disabled={!isLoaded}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Reset View
                </button>
                <button
                  onClick={handleSetTopView}
                  disabled={!isLoaded}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  Top View
                </button>
                <button
                  onClick={handleToggleRotation}
                  disabled={!isLoaded}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {autoRotationEnabled ? 'Disable' : 'Enable'} Auto-Rotation
                </button>
              </div>
              <pre className="text-sm text-gray-800 dark:text-gray-200 overflow-x-auto">
{`const globeRef = useRef<EarthGlobeRef>(null);

<EarthGlobe
  ref={globeRef}
  className="w-full h-full"
  onLoad={() => console.log('Globe loaded!')}
/>

// Programmatic control
globeRef.current?.resetView();
globeRef.current?.setCameraPosition([0, 5, 0]);
globeRef.current?.toggleAutoRotation(false);`}
              </pre>
            </div>
          </div>
        </section>

        {/* Keyboard Controls Info */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Keyboard Controls
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <ul className="space-y-2 text-gray-600 dark:text-gray-400">
              <li>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">
                  Arrow Left/Right
                </kbd>
                {' '}- Rotate globe horizontally
              </li>
              <li>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">
                  Arrow Up/Down
                </kbd>
                {' '}- Rotate globe vertically
              </li>
              <li>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">
                  Spacebar
                </kbd>
                {' '}- Toggle auto-rotation
              </li>
              <li>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">
                  Mouse Drag
                </kbd>
                {' '}- Rotate globe in any direction
              </li>
              <li>
                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono">
                  Mouse Wheel
                </kbd>
                {' '}- Zoom in/out
              </li>
            </ul>
          </div>
        </section>

        {/* Integration Notes */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Integration Notes
          </h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <ul className="space-y-3 text-gray-600 dark:text-gray-400">
              <li>
                <strong className="text-gray-900 dark:text-white">Container Sizing:</strong>
                {' '}The component fills its container, so ensure the parent has explicit dimensions.
              </li>
              <li>
                <strong className="text-gray-900 dark:text-white">Performance:</strong>
                {' '}The globe maintains 30+ FPS on modern browsers with hardware acceleration.
              </li>
              <li>
                <strong className="text-gray-900 dark:text-white">Accessibility:</strong>
                {' '}Includes ARIA labels and keyboard navigation support.
              </li>
              <li>
                <strong className="text-gray-900 dark:text-white">Error Handling:</strong>
                {' '}Gracefully handles WebGL unavailability and texture loading failures.
              </li>
              <li>
                <strong className="text-gray-900 dark:text-white">Theme Support:</strong>
                {' '}Automatically adapts background color based on light/dark theme.
              </li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
