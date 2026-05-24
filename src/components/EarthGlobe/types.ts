// TypeScript interfaces and types for the EarthGlobe component

/**
 * Props for the EarthGlobe component
 * 
 * @example Basic usage
 * ```tsx
 * <EarthGlobe className="w-full h-screen" />
 * ```
 * 
 * @example With custom camera position
 * ```tsx
 * <EarthGlobe
 *   className="w-full h-screen"
 *   initialCameraPosition={[3, 2, 4]}
 *   initialZoom={3}
 * />
 * ```
 * 
 * @example With callbacks and custom background
 * ```tsx
 * <EarthGlobe
 *   className="w-full h-screen"
 *   backgroundColor="#1a1a2e"
 *   onLoad={() => console.log('Globe loaded!')}
 *   disableAutoRotation={false}
 * />
 * ```
 */
export interface EarthGlobeProps {
  /**
   * Custom CSS class for the container element
   */
  className?: string;
  
  initialCameraPosition?: [number, number, number];
  initialZoom?: number;
  disableAutoRotation?: boolean;
  onLoad?: () => void;
  backgroundColor?: string;
  /** Ref that will be populated with a function to navigate the globe to a city by index */
  onNavigateToCityRef?: React.MutableRefObject<((cityIndex: number) => void) | null>;
  /** Language code for post title translation (e.g. 'en', 'es', 'fr') */
  language?: string;
}

/**
 * Ref API for programmatic control of the EarthGlobe component
 * 
 * Use React's useRef hook to access these methods for controlling
 * the globe programmatically.
 * 
 * @example
 * ```tsx
 * const globeRef = useRef<EarthGlobeRef>(null);
 * 
 * <EarthGlobe ref={globeRef} />
 * 
 * // Later, control the globe
 * globeRef.current?.resetView();
 * globeRef.current?.setCameraPosition([0, 5, 0]);
 * globeRef.current?.toggleAutoRotation(false);
 * ```
 */
export interface EarthGlobeRef {
  /**
   * Reset camera to the initial position
   * 
   * Returns the camera to the position specified by initialCameraPosition
   * (or the default position if not specified). Useful for providing a
   * "reset view" button in your UI.
   * 
   * @example
   * ```tsx
   * <button onClick={() => globeRef.current?.resetView()}>
   *   Reset View
   * </button>
   * ```
   */
  resetView: () => void;
  
  /**
   * Programmatically set the camera position
   * 
   * Moves the camera to a specific position in 3D space. The position
   * is specified as [x, y, z] coordinates relative to the globe center.
   * 
   * @param position - Target camera position [x, y, z]
   * 
   * @example Move to top view
   * ```tsx
   * globeRef.current?.setCameraPosition([0, 5, 0]);
   * ```
   * 
   * @example Move to side view
   * ```tsx
   * globeRef.current?.setCameraPosition([5, 0, 0]);
   * ```
   */
  setCameraPosition: (position: [number, number, number]) => void;
  
  /**
   * Toggle automatic rotation on or off
   * 
   * Enables or disables the automatic rotation of the globe.
   * When enabled, the globe rotates continuously when idle.
   * 
   * @param enabled - true to enable auto-rotation, false to disable
   * 
   * @example Toggle rotation
   * ```tsx
   * const [rotating, setRotating] = useState(true);
   * 
   * <button onClick={() => {
   *   const newState = !rotating;
   *   setRotating(newState);
   *   globeRef.current?.toggleAutoRotation(newState);
   * }}>
   *   {rotating ? 'Stop' : 'Start'} Rotation
   * </button>
   * ```
   */
  toggleAutoRotation: (enabled: boolean) => void;
}

/**
 * Internal props for the Earth component
 * 
 * @internal
 * This interface is used internally and should not be used directly
 * by consumers of the EarthGlobe component.
 */
export interface EarthProps {
  disableAutoRotation?: boolean;
  onLoad?: () => void;
  initialCameraPosition?: [number, number, number];
  initialZoom?: number;
  onNavigateToCityRef?: React.MutableRefObject<((cityIndex: number) => void) | null>;
  language?: string;
}

/**
 * Configuration for OrbitControls behavior
 * 
 * @internal
 * This interface defines the configuration for the Three.js OrbitControls
 * used to handle user interaction with the globe.
 */
export interface OrbitControlsConfig {
  /** Enable smooth damping (momentum) for camera movement */
  enableDamping: boolean;
  /** Damping factor for momentum decay (0-1, lower = more momentum) */
  dampingFactor: number;
  /** Rotation sensitivity multiplier */
  rotateSpeed: number;
  /** Minimum camera distance from globe center */
  minDistance: number;
  /** Maximum camera distance from globe center */
  maxDistance: number;
  /** Enable panning (disabled for globe to prevent off-center view) */
  enablePan: boolean;
  /** Enable zoom via scroll/pinch */
  enableZoom: boolean;
  /** Enable automatic rotation when idle */
  autoRotate?: boolean;
  /** Speed of automatic rotation (degrees per frame at 60fps) */
  autoRotateSpeed: number;
}
