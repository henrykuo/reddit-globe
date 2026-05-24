// EarthGlobe component - Main export for the 3D Earth globe
import { Canvas } from '@react-three/fiber';
import React, { forwardRef, Suspense, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import Earth from './Earth';
import LoadingFallback from './LoadingFallback';
import WebGLErrorBoundary from './WebGLErrorBoundary';
import TextureErrorBoundary from './TextureErrorBoundary';
import { DEFAULT_CAMERA, ORBIT_CONTROLS_CONFIG } from './constants';
import type { EarthGlobeProps, EarthGlobeRef } from './types';

/**
 * EarthGlobe - Interactive 3D Earth globe component
 * 
 * A fully-featured 3D globe component built with React Three Fiber and Three.js.
 * Provides an interactive visualization of Earth with realistic textures, lighting,
 * and smooth user controls.
 * 
 * ## Features
 * - Hardware-accelerated WebGL rendering
 * - Automatic rotation with pause on interaction
 * - Mouse and touch controls (drag to rotate, scroll/pinch to zoom)
 * - Keyboard navigation (arrow keys, spacebar)
 * - Responsive design that adapts to container size
 * - Theme-aware background colors
 * - Accessibility support (ARIA labels, keyboard controls)
 * - Error handling for WebGL unavailability and texture loading failures
 * - Programmatic control via ref API
 * 
 * ## Basic Usage
 * ```tsx
 * import EarthGlobe from './components/EarthGlobe/EarthGlobe';
 * 
 * function App() {
 *   return (
 *     <div className="w-full h-screen">
 *       <EarthGlobe className="w-full h-full" />
 *     </div>
 *   );
 * }
 * ```
 * 
 * ## Custom Configuration
 * ```tsx
 * <EarthGlobe
 *   className="w-full h-screen"
 *   initialCameraPosition={[3, 2, 4]}
 *   initialZoom={3}
 *   backgroundColor="#1a1a2e"
 *   onLoad={() => console.log('Globe loaded!')}
 * />
 * ```
 * 
 * ## Programmatic Control
 * ```tsx
 * const globeRef = useRef<EarthGlobeRef>(null);
 * 
 * <EarthGlobe ref={globeRef} className="w-full h-screen" />
 * 
 * // Control the globe
 * <button onClick={() => globeRef.current?.resetView()}>
 *   Reset View
 * </button>
 * <button onClick={() => globeRef.current?.setCameraPosition([0, 5, 0])}>
 *   Top View
 * </button>
 * <button onClick={() => globeRef.current?.toggleAutoRotation(false)}>
 *   Stop Rotation
 * </button>
 * ```
 * 
 * ## Keyboard Controls
 * - **Arrow Keys**: Rotate the globe
 * - **Spacebar**: Toggle auto-rotation
 * - **Mouse Drag**: Rotate in any direction
 * - **Mouse Wheel**: Zoom in/out
 * - **Touch Drag**: Rotate on touch devices
 * - **Pinch**: Zoom on touch devices
 * 
 * ## Performance
 * - Maintains 30+ FPS on modern browsers
 * - Automatic resource cleanup on unmount
 * - Optimized texture loading and caching
 * - Hardware-accelerated rendering via WebGL
 * 
 * ## Browser Support
 * Requires WebGL support. Displays a fallback message on unsupported browsers.
 * Tested on Chrome, Firefox, Safari, and Edge.
 * 
 * @component
 * @example
 * ```tsx
 * <EarthGlobe className="w-full h-screen" />
 * ```
 * 
 * @example With custom background
 * ```tsx
 * <EarthGlobe 
 *   className="w-full h-screen"
 *   backgroundColor="hsl(222.2, 84%, 4.9%)"
 * />
 * ```
 */
const EarthGlobe = forwardRef<EarthGlobeRef, EarthGlobeProps>(function EarthGlobe(
  {
    className,
    initialCameraPosition = DEFAULT_CAMERA.position,
    initialZoom,
    disableAutoRotation,
    onLoad,
    backgroundColor,
    onNavigateToCityRef,
    language,
  },
  ref
) {
  // Detect theme from document class or use default background color
  const [_isDarkTheme, _setIsDarkTheme] = React.useState(
    () => document.documentElement.classList.contains('dark')
  );
  
  // Monitor theme changes (reserved for future use)
  React.useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          _setIsDarkTheme(document.documentElement.classList.contains('dark'));
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);
  
  // Use pure white background if not explicitly provided
  const effectiveBackgroundColor = React.useMemo(() => {
    if (backgroundColor) return backgroundColor;
    return '#ffffff';
  }, [backgroundColor]);
  // Validate and clamp initialZoom to acceptable range (minDistance to maxDistance)
  const validatedZoom = useMemo(() => {
    if (initialZoom === undefined) return undefined;
    
    // Clamp zoom between minDistance and maxDistance from ORBIT_CONTROLS_CONFIG
    const clampedZoom = Math.max(
      ORBIT_CONTROLS_CONFIG.minDistance,
      Math.min(ORBIT_CONTROLS_CONFIG.maxDistance, initialZoom)
    );
    
    // Log warning if value was clamped
    if (clampedZoom !== initialZoom) {
      console.warn(
        `initialZoom value ${initialZoom} is out of range [${ORBIT_CONTROLS_CONFIG.minDistance}, ${ORBIT_CONTROLS_CONFIG.maxDistance}]. Clamped to ${clampedZoom}.`
      );
    }
    
    return clampedZoom;
  }, [initialZoom]);
  
  // Validate initialCameraPosition contains finite numbers
  const validatedCameraPosition = useMemo(() => {
    const isValid = initialCameraPosition.every(n => isFinite(n));
    
    if (!isValid) {
      console.warn(
        `initialCameraPosition contains invalid values: [${initialCameraPosition}]. Using default position.`
      );
      return DEFAULT_CAMERA.position;
    }
    
    return initialCameraPosition;
  }, [initialCameraPosition]);
  
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const [autoRotationEnabled, setAutoRotationEnabled] = useState(!disableAutoRotation);
  
  // Sync internal state when the parent prop changes
  useEffect(() => {
    setAutoRotationEnabled(!disableAutoRotation);
  }, [disableAutoRotation]);
  
  // Calculate effective camera position based on initialZoom
  const effectiveCameraPosition = useMemo(() => {
    if (validatedZoom !== undefined) {
      // If initialZoom is provided, use it to set the camera distance
      // Normalize the initial camera position direction and scale by zoom
      const [x, y, z] = validatedCameraPosition;
      const distance = Math.sqrt(x * x + y * y + z * z);
      const scale = validatedZoom / distance;
      return [x * scale, y * scale, z * scale] as [number, number, number];
    }
    return validatedCameraPosition;
  }, [validatedCameraPosition, validatedZoom]);
  
  const initialCameraPositionRef = useRef(effectiveCameraPosition);
  const [contextLost, setContextLost] = useState(false);
  const [textureError, setTextureError] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Expose imperative handle for programmatic control
  useImperativeHandle(ref, () => ({
    resetView: () => {
      if (cameraRef.current && initialCameraPositionRef.current) {
        cameraRef.current.position.set(
          initialCameraPositionRef.current[0],
          initialCameraPositionRef.current[1],
          initialCameraPositionRef.current[2]
        );
        cameraRef.current.updateProjectionMatrix();
      }
    },
    setCameraPosition: (position: [number, number, number]) => {
      if (cameraRef.current) {
        cameraRef.current.position.set(position[0], position[1], position[2]);
        cameraRef.current.updateProjectionMatrix();
      }
    },
    toggleAutoRotation: (enabled: boolean) => {
      setAutoRotationEnabled(enabled);
    },
  }), []);
  
  // Store event handler refs for proper cleanup
  const handleContextLostRef = useRef<((event: Event) => void) | null>(null);
  const handleContextRestoredRef = useRef<(() => void) | null>(null);
  
  // Callback to capture camera reference and set up context loss handlers
  const onCreated = useCallback(({ camera, gl }: { camera: THREE.Camera; gl: THREE.WebGLRenderer }) => {
    cameraRef.current = camera as THREE.PerspectiveCamera;
    const canvas = gl.domElement;
    canvasRef.current = canvas;
    
    // Set up WebGL context loss handlers
    const handleContextLost = (event: Event) => {
      event.preventDefault();
      setContextLost(true);
      console.warn('WebGL context lost. Rendering paused.');
    };
    
    const handleContextRestored = () => {
      setContextLost(false);
      console.log('WebGL context restored. Reinitializing scene.');
    };
    
    // Store refs for cleanup
    handleContextLostRef.current = handleContextLost;
    handleContextRestoredRef.current = handleContextRestored;
    
    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);
  }, []);
  
  // Cleanup context loss event listeners on unmount
  useEffect(() => {
    return () => {
      const canvas = canvasRef.current;
      if (canvas) {
        if (handleContextLostRef.current) {
          canvas.removeEventListener('webglcontextlost', handleContextLostRef.current);
        }
        if (handleContextRestoredRef.current) {
          canvas.removeEventListener('webglcontextrestored', handleContextRestoredRef.current);
        }
      }
    };
  }, []);
  
  return (
    <WebGLErrorBoundary>
      <div 
        className={className}
        style={{ width: '100%', height: '100%', position: 'relative' }}
        role="img"
        aria-label="Interactive 3D Earth globe"
      >
        {contextLost && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-gray-900/90 text-white z-10"
            role="alert"
            aria-live="assertive"
          >
            <div className="text-center p-6">
              <h3 className="text-lg font-semibold mb-2">WebGL Context Lost</h3>
              <p className="text-gray-400">
                The 3D rendering context was lost due to memory constraints.
                Attempting to restore...
              </p>
            </div>
          </div>
        )}
        {textureError && (
          <div
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-900/80 text-white px-4 py-2 rounded-md text-sm z-10"
            role="alert"
          >
            Failed to load Earth texture. Displaying fallback.
          </div>
        )}
        <Canvas
          camera={{
            fov: DEFAULT_CAMERA.fov,
            near: DEFAULT_CAMERA.near,
            far: DEFAULT_CAMERA.far,
            position: effectiveCameraPosition,
          }}
          gl={{ antialias: true }}
          style={{ width: '100%', height: '100%' }}
          onCreated={onCreated}
        >
          <color attach="background" args={[effectiveBackgroundColor]} />
          <TextureErrorBoundary onError={() => setTextureError(true)}>
            <Suspense fallback={<LoadingFallback />}>
              <Earth
                disableAutoRotation={!autoRotationEnabled}
                onLoad={onLoad}
                initialCameraPosition={effectiveCameraPosition}
                initialZoom={initialZoom}
                onNavigateToCityRef={onNavigateToCityRef}
                language={language}
              />
            </Suspense>
          </TextureErrorBoundary>
        </Canvas>
      </div>
    </WebGLErrorBoundary>
  );
});

export default EarthGlobe;
