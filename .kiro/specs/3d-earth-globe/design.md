# Design Document: 3D Earth Globe

## Overview

This design document specifies the technical implementation of an interactive 3D Earth globe component for a React + TypeScript + Vite application. The component will leverage Three.js through the React Three Fiber (R3F) abstraction layer to provide hardware-accelerated WebGL rendering with a declarative React API.

The implementation will create a self-contained `EarthGlobe` component that manages its own 3D scene, camera, lighting, and interaction controls. The component will integrate seamlessly with the existing Tailwind CSS and shadcn/ui design system while maintaining high performance through efficient resource management and optimized rendering techniques.

### Technology Stack

- **Three.js**: Core 3D rendering engine providing WebGL abstractions
- **@react-three/fiber**: React renderer for Three.js, enabling declarative 3D scene composition
- **@react-three/drei**: Helper library providing common 3D patterns (OrbitControls, useTexture, etc.)
- **React 18+**: Component framework with concurrent features
- **TypeScript**: Type-safe development
- **Vite**: Build tool with fast HMR and optimized production builds

### Key Design Decisions

1. **React Three Fiber over vanilla Three.js**: Provides declarative API that aligns with React patterns, automatic cleanup, and better integration with React lifecycle
2. **Sphere geometry with texture mapping**: Standard approach for globe visualization, balancing visual quality with performance
3. **OrbitControls for interaction**: Battle-tested solution for 3D camera manipulation with built-in momentum and constraints
4. **Lazy texture loading with Suspense**: Leverages React 18 Suspense for graceful loading states
5. **requestAnimationFrame-based animation**: Standard browser API for smooth 60fps rendering

## Architecture

### Component Hierarchy

```
EarthGlobe (React Component)
├── Canvas (@react-three/fiber)
│   ├── Suspense (React)
│   │   └── Earth (Internal 3D Component)
│   │       ├── Sphere (Mesh)
│   │       │   ├── SphereGeometry
│   │       │   └── MeshStandardMaterial (with texture)
│   │       ├── AmbientLight
│   │       ├── DirectionalLight
│   │       └── OrbitControls
│   └── LoadingFallback (2D React Component)
└── ErrorBoundary (React Component)
```

### Data Flow

1. **Initialization**: Component mounts → Canvas creates WebGL context → Suspense triggers texture loading
2. **Texture Loading**: useTexture hook fetches Earth texture → Suspense shows fallback → Texture applied to material
3. **User Interaction**: Mouse/touch events → OrbitControls updates camera → Scene re-renders
4. **Auto-rotation**: useFrame hook called each frame → Rotation state updated → Mesh rotation applied
5. **Cleanup**: Component unmounts → R3F disposes WebGL resources automatically

### Module Structure

```
src/
├── components/
│   └── EarthGlobe/
│       ├── EarthGlobe.tsx          # Main component export
│       ├── Earth.tsx                # Internal 3D scene component
│       ├── types.ts                 # TypeScript interfaces
│       └── constants.ts             # Configuration constants
└── assets/
    └── textures/
        └── earth-texture.jpg        # Earth surface imagery
```

## Components and Interfaces

### EarthGlobe Component (Main Export)

The primary component that consumers will import and use.

```typescript
interface EarthGlobeProps {
  /** Custom CSS class for the container */
  className?: string;
  
  /** Initial camera position [x, y, z] */
  initialCameraPosition?: [number, number, number];
  
  /** Initial zoom level (distance from globe) */
  initialZoom?: number;
  
  /** Disable automatic rotation */
  disableAutoRotation?: boolean;
  
  /** Callback fired when globe is fully loaded */
  onLoad?: () => void;
  
  /** Background color for the scene */
  backgroundColor?: string;
}

interface EarthGlobeRef {
  /** Reset camera to initial position */
  resetView: () => void;
  
  /** Programmatically set camera position */
  setCameraPosition: (position: [number, number, number]) => void;
  
  /** Toggle automatic rotation */
  toggleAutoRotation: (enabled: boolean) => void;
}
```

**Responsibilities:**
- Render Canvas component with appropriate configuration
- Wrap 3D content in Suspense boundary with loading fallback
- Wrap in ErrorBoundary for WebGL failure handling
- Forward ref for imperative API
- Apply Tailwind className to container

### Earth Component (Internal)

The internal component that renders the actual 3D globe within the Canvas context.

```typescript
interface EarthProps {
  disableAutoRotation?: boolean;
  onLoad?: () => void;
  initialCameraPosition?: [number, number, number];
  initialZoom?: number;
}
```

**Responsibilities:**
- Load Earth texture using useTexture hook
- Create sphere geometry and material
- Implement auto-rotation logic using useFrame
- Configure OrbitControls with appropriate constraints
- Set up scene lighting (ambient + directional)
- Handle keyboard controls for accessibility
- Manage interaction timeout for auto-rotation resume

### OrbitControls Configuration

```typescript
interface OrbitControlsConfig {
  enableDamping: true;           // Smooth momentum
  dampingFactor: 0.05;           // Momentum decay rate
  rotateSpeed: 0.5;              // Rotation sensitivity
  minDistance: 1.5;              // Closest zoom (globe radius = 1)
  maxDistance: 10;               // Farthest zoom
  enablePan: false;              // Disable panning
  enableZoom: true;              // Enable zoom
  autoRotate: boolean;           // Dynamic based on interaction
  autoRotateSpeed: 0.6;          // 1 rotation per 60 seconds
}
```

## Data Models

### Texture Asset

```typescript
interface TextureAsset {
  /** Path to texture file in public directory */
  path: string;
  
  /** Expected format (jpg, png, webp) */
  format: 'jpg' | 'png' | 'webp';
  
  /** Recommended resolution for quality/performance balance */
  resolution: '2k' | '4k' | '8k';
}

// Default texture configuration
const EARTH_TEXTURE: TextureAsset = {
  path: '/textures/earth-texture.jpg',
  format: 'jpg',
  resolution: '2k'  // 2048x1024 for balance
};
```

### Camera Configuration

```typescript
interface CameraConfig {
  /** Field of view in degrees */
  fov: number;
  
  /** Near clipping plane */
  near: number;
  
  /** Far clipping plane */
  far: number;
  
  /** Initial position [x, y, z] */
  position: [number, number, number];
}

const DEFAULT_CAMERA: CameraConfig = {
  fov: 45,
  near: 0.1,
  far: 1000,
  position: [0, 0, 5]  // 5 units away from origin
};
```

### Lighting Configuration

```typescript
interface LightingConfig {
  ambient: {
    color: string;
    intensity: number;
  };
  directional: {
    color: string;
    intensity: number;
    position: [number, number, number];
  };
}

const DEFAULT_LIGHTING: LightingConfig = {
  ambient: {
    color: '#ffffff',
    intensity: 0.4  // Soft ambient light
  },
  directional: {
    color: '#ffffff',
    intensity: 1.0,
    position: [5, 3, 5]  // From upper-right
  }
};
```

### Animation State

```typescript
interface AnimationState {
  /** Whether auto-rotation is currently active */
  isAutoRotating: boolean;
  
  /** Timestamp of last user interaction */
  lastInteractionTime: number;
  
  /** Timeout ID for resuming auto-rotation */
  resumeTimeoutId: number | null;
  
  /** Current rotation angle in radians */
  currentRotation: number;
}
```

### Performance Metrics

```typescript
interface PerformanceMetrics {
  /** Current frames per second */
  fps: number;
  
  /** Texture load time in milliseconds */
  textureLoadTime: number;
  
  /** WebGL memory usage estimate */
  memoryUsage: number;
  
  /** Whether hardware acceleration is active */
  isHardwareAccelerated: boolean;
}
```



## Implementation Details

### Texture Loading Strategy

The component will use React Three Fiber's `useTexture` hook, which internally uses Three.js's TextureLoader. The texture will be loaded asynchronously and cached by the browser.

```typescript
// Inside Earth component
const earthTexture = useTexture('/textures/earth-texture.jpg');

// Configure texture properties
earthTexture.anisotropy = 16;  // Maximum quality
earthTexture.encoding = THREE.sRGBEncoding;  // Correct color space
```

**Loading States:**
1. **Initial**: Suspense fallback shows loading spinner
2. **Loading**: Browser fetches texture asset
3. **Success**: Texture applied to material, onLoad callback fired
4. **Error**: ErrorBoundary catches and displays fallback UI

### Auto-Rotation Logic

Auto-rotation will be implemented using the `useFrame` hook, which is called on every animation frame:

```typescript
const [autoRotate, setAutoRotate] = useState(!disableAutoRotation);
const [lastInteraction, setLastInteraction] = useState(Date.now());
const meshRef = useRef<THREE.Mesh>(null);

useFrame((state, delta) => {
  if (!meshRef.current) return;
  
  // Check if we should resume auto-rotation
  const timeSinceInteraction = Date.now() - lastInteraction;
  if (!autoRotate && timeSinceInteraction > 3000) {
    setAutoRotate(true);
  }
  
  // Apply rotation if enabled
  if (autoRotate) {
    meshRef.current.rotation.y += delta * 0.1;  // ~1 rotation per 60s
  }
});
```

### Interaction Handling

OrbitControls will handle most interaction automatically. We'll add event listeners to detect when interaction starts:

```typescript
const controlsRef = useRef<OrbitControlsImpl>(null);

useEffect(() => {
  const controls = controlsRef.current;
  if (!controls) return;
  
  const handleInteractionStart = () => {
    setAutoRotate(false);
    setLastInteraction(Date.now());
  };
  
  controls.addEventListener('start', handleInteractionStart);
  
  return () => {
    controls.removeEventListener('start', handleInteractionStart);
  };
}, []);
```

### Keyboard Controls

Keyboard navigation will be implemented for accessibility:

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!meshRef.current) return;
    
    const rotationSpeed = 0.1;
    
    switch (e.key) {
      case 'ArrowLeft':
        meshRef.current.rotation.y -= rotationSpeed;
        setLastInteraction(Date.now());
        break;
      case 'ArrowRight':
        meshRef.current.rotation.y += rotationSpeed;
        setLastInteraction(Date.now());
        break;
      case 'ArrowUp':
        meshRef.current.rotation.x -= rotationSpeed;
        setLastInteraction(Date.now());
        break;
      case 'ArrowDown':
        meshRef.current.rotation.x += rotationSpeed;
        setLastInteraction(Date.now());
        break;
      case ' ':
        e.preventDefault();
        setAutoRotate(prev => !prev);
        break;
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

### Responsive Handling

React Three Fiber's Canvas component automatically handles resize events. We'll configure it to be responsive:

```typescript
<Canvas
  camera={{ fov: 45, near: 0.1, far: 1000, position: initialCameraPosition }}
  gl={{ antialias: true, alpha: true }}
  style={{ width: '100%', height: '100%' }}
  onCreated={({ gl }) => {
    // Verify WebGL support
    if (!gl.capabilities.isWebGL2) {
      console.warn('WebGL 2 not supported, falling back to WebGL 1');
    }
  }}
>
```

### Resource Cleanup

React Three Fiber automatically disposes of Three.js resources when components unmount. However, we'll ensure proper cleanup of event listeners and timeouts:

```typescript
useEffect(() => {
  return () => {
    // Clear any pending timeouts
    if (resumeTimeoutId) {
      clearTimeout(resumeTimeoutId);
    }
  };
}, [resumeTimeoutId]);
```

### Error Handling

We'll implement a custom ErrorBoundary specifically for WebGL errors:

```typescript
class WebGLErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-900 text-white">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-2">WebGL Not Supported</h2>
            <p className="text-gray-400">
              Your browser doesn't support WebGL or it's disabled.
              Please try a modern browser like Chrome, Firefox, or Edge.
            </p>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

### Performance Optimizations

1. **Geometry Reuse**: Create sphere geometry once and reuse
2. **Texture Compression**: Use compressed JPG format (2K resolution)
3. **Memoization**: Memoize expensive calculations
4. **Conditional Rendering**: Only render when visible (using Intersection Observer if needed)
5. **LOD (Level of Detail)**: Could be added later for very large scenes

```typescript
// Memoize sphere geometry
const sphereGeometry = useMemo(
  () => new THREE.SphereGeometry(1, 64, 64),
  []
);

// Memoize material
const material = useMemo(
  () => new THREE.MeshStandardMaterial({
    map: earthTexture,
    roughness: 0.8,
    metalness: 0.2
  }),
  [earthTexture]
);
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Sphere Geometry with Texture

*For any* rendered globe instance, the scene SHALL contain a mesh with sphere geometry and a material that has a texture map applied.

**Validates: Requirements 1.1**

### Property 2: Scene Lighting Configuration

*For any* rendered globe scene, the scene SHALL contain both an ambient light and a directional light with positive intensity values.

**Validates: Requirements 1.2**

### Property 3: WebGL Context Creation

*For any* mounted Globe_Component instance, the Canvas SHALL create a WebGL rendering context with hardware acceleration capabilities enabled.

**Validates: Requirements 1.5**

### Property 4: Aspect Ratio Preservation on Resize

*For any* browser window resize event, the camera aspect ratio SHALL be recalculated to match the new canvas dimensions, maintaining the globe's proportions.

**Validates: Requirements 1.6, 4.3**

### Property 5: Interaction Triggers Rotation Change

*For any* user drag input (mouse or touch), the camera position or globe rotation SHALL change in the direction corresponding to the drag vector.

**Validates: Requirements 2.1**

### Property 6: Scroll Zoom Behavior

*For any* mouse wheel scroll event, the camera distance from the globe SHALL increase for scroll-out and decrease for scroll-in.

**Validates: Requirements 2.2**

### Property 7: Pinch Zoom Behavior

*For any* touch pinch gesture, the camera distance SHALL change proportionally to the pinch scale factor.

**Validates: Requirements 2.3**

### Property 8: Damping Configuration

*For any* OrbitControls instance, the enableDamping property SHALL be set to true and dampingFactor SHALL be configured to provide smooth momentum.

**Validates: Requirements 2.4**

### Property 9: Zoom Constraints

*For any* zoom operation, the camera distance SHALL remain within the configured minDistance and maxDistance bounds, preventing the camera from entering the globe or moving too far away.

**Validates: Requirements 2.5**

### Property 10: Auto-Rotation Resume After Inactivity

*For any* user interaction event, if no subsequent interaction occurs for 3 seconds, the auto-rotation state SHALL transition from false to true.

**Validates: Requirements 2.6, 3.4**

### Property 11: Initial Auto-Rotation State

*For any* Globe_Component instance mounted without the disableAutoRotation prop, the auto-rotation SHALL be enabled and the mesh rotation.y value SHALL increase over time.

**Validates: Requirements 3.1**

### Property 12: Rotation Speed Configuration

*For any* OrbitControls instance with auto-rotation enabled, the autoRotateSpeed SHALL be set to 0.6, resulting in one complete rotation per 60 seconds at 60fps.

**Validates: Requirements 3.2**

### Property 13: Interaction Pauses Auto-Rotation

*For any* user interaction event (drag, scroll, pinch, or keyboard), the auto-rotation state SHALL immediately transition to false.

**Validates: Requirements 3.3**

### Property 14: Container Dimensions

*For any* rendered Globe_Component, the Canvas element SHALL have width and height styles set to 100% to fill its container.

**Validates: Requirements 4.1**

### Property 15: Multi-Viewport Compatibility

*For any* viewport width between 320px and 3840px, the Globe_Component SHALL render without errors and the canvas SHALL update its dimensions to match the viewport.

**Validates: Requirements 4.4**

### Property 16: Input Method Support

*For any* OrbitControls instance, both mouse events and touch events SHALL trigger appropriate camera manipulation responses.

**Validates: Requirements 4.5**

### Property 17: Resource Cleanup on Unmount

*For any* Globe_Component instance that unmounts, all WebGL resources (geometries, materials, textures) SHALL have their dispose methods called.

**Validates: Requirements 5.1**

### Property 18: Geometry and Material Memoization

*For any* Globe_Component re-render that doesn't change texture or configuration props, the sphere geometry and material instances SHALL be reused rather than recreated.

**Validates: Requirements 5.2**

### Property 19: Compressed Texture Format

*For any* texture loaded by the Texture_Loader, the file format SHALL be a compressed format (JPG or WebP) to minimize memory usage.

**Validates: Requirements 5.4**

### Property 20: ClassName Prop Application

*For any* Globe_Component instance with a className prop, the provided CSS class SHALL be applied to the container element.

**Validates: Requirements 6.1, 9.3**

### Property 21: Anti-Aliasing Configuration

*For any* Canvas instance, the WebGL context SHALL be created with the antialias property set to true.

**Validates: Requirements 6.3**

### Property 22: ARIA Labels for Accessibility

*For any* rendered Globe_Component, the container element SHALL include aria-label or aria-describedby attributes describing the interactive 3D globe.

**Validates: Requirements 7.1**

### Property 23: Keyboard Arrow Key Navigation

*For any* arrow key press event, the globe rotation SHALL change in the direction corresponding to the key (left/right for y-axis, up/down for x-axis).

**Validates: Requirements 7.3**

### Property 24: Spacebar Toggle

*For any* spacebar key press event, the auto-rotation state SHALL toggle between true and false.

**Validates: Requirements 7.4**

### Property 25: Reset View API

*For any* Globe_Component ref, calling the resetView method SHALL return the camera position to the initial configured position.

**Validates: Requirements 7.5**

### Property 26: Loading State Transitions

*For any* Globe_Component instance, while the texture is loading (Suspense active), a loading indicator SHALL be visible, and after loading completes, the indicator SHALL be hidden and the textured globe SHALL be visible.

**Validates: Requirements 8.1, 8.3**

### Property 27: Texture Path Configuration

*For any* Texture_Loader invocation, the texture path SHALL reference the public assets directory.

**Validates: Requirements 8.2**

### Property 28: Multi-Format Texture Support

*For any* valid image file format (JPG, PNG, WebP), the Texture_Loader SHALL successfully load and apply the texture to the globe material.

**Validates: Requirements 8.5**

### Property 29: Initial Camera Configuration Props

*For any* Globe_Component instance with initialCameraPosition or initialZoom props, the camera SHALL be positioned according to the provided values at mount time.

**Validates: Requirements 9.1**

### Property 30: Disable Auto-Rotation Prop

*For any* Globe_Component instance with disableAutoRotation={true}, the auto-rotation SHALL not be enabled at mount time.

**Validates: Requirements 9.2**

### Property 31: Ref API Methods

*For any* Globe_Component ref, the ref object SHALL expose resetView, setCameraPosition, and toggleAutoRotation methods.

**Validates: Requirements 9.4**

### Property 32: OnLoad Callback Invocation

*For any* Globe_Component instance with an onLoad callback prop, the callback SHALL be invoked once when the texture loading completes and the globe is fully initialized.

**Validates: Requirements 9.5**



## Error Handling

### WebGL Unavailability

**Scenario**: User's browser doesn't support WebGL or it's disabled.

**Handling Strategy**:
- Wrap the entire component in a custom `WebGLErrorBoundary`
- Catch any WebGL initialization errors
- Display a user-friendly fallback message with instructions to upgrade browser or enable WebGL
- Log error details to console for debugging

**Implementation**:
```typescript
<WebGLErrorBoundary>
  <EarthGlobe {...props} />
</WebGLErrorBoundary>
```

### Texture Loading Failure

**Scenario**: Earth texture file fails to load (404, network error, CORS issue).

**Handling Strategy**:
- Use React Error Boundary to catch Suspense errors
- Display a solid-colored sphere as fallback
- Show a subtle error message to the user
- Log detailed error information to console
- Provide retry mechanism if appropriate

**Implementation**:
```typescript
<ErrorBoundary fallback={<SolidGlobeFallback />}>
  <Suspense fallback={<LoadingSpinner />}>
    <Earth {...props} />
  </Suspense>
</ErrorBoundary>
```

### Texture Loading Timeout

**Scenario**: Texture takes longer than 10 seconds to load.

**Handling Strategy**:
- Implement a timeout mechanism in the texture loading logic
- After 10 seconds, cancel the load and trigger error boundary
- Display the same fallback as texture loading failure

**Implementation**:
```typescript
useEffect(() => {
  const timeout = setTimeout(() => {
    if (!textureLoaded) {
      throw new Error('Texture loading timeout');
    }
  }, 10000);
  
  return () => clearTimeout(timeout);
}, [textureLoaded]);
```

### Performance Degradation

**Scenario**: Device cannot maintain acceptable frame rate.

**Handling Strategy**:
- Monitor FPS using performance APIs
- If FPS drops below 20 for sustained period, reduce quality settings:
  - Lower sphere geometry segments (from 64 to 32)
  - Disable auto-rotation
  - Reduce texture resolution
- Display optional performance warning to user

### Memory Constraints

**Scenario**: Device has limited memory causing WebGL context loss.

**Handling Strategy**:
- Listen for `webglcontextlost` event
- Pause rendering and display message to user
- On `webglcontextrestored`, reinitialize the scene
- Use lower quality textures on mobile devices

**Implementation**:
```typescript
canvas.addEventListener('webglcontextlost', (event) => {
  event.preventDefault();
  setContextLost(true);
});

canvas.addEventListener('webglcontextrestored', () => {
  setContextLost(false);
  reinitializeScene();
});
```

### Invalid Props

**Scenario**: Component receives invalid prop values (e.g., negative zoom, invalid camera position).

**Handling Strategy**:
- Validate props using TypeScript types and runtime checks
- Provide sensible defaults for invalid values
- Log warnings to console for developer awareness
- Clamp values to acceptable ranges

**Implementation**:
```typescript
const validatedZoom = Math.max(1.5, Math.min(10, initialZoom ?? 5));
const validatedPosition = initialCameraPosition?.every(n => isFinite(n))
  ? initialCameraPosition
  : DEFAULT_CAMERA.position;
```

### Resize Event Throttling

**Scenario**: Rapid resize events could cause performance issues.

**Handling Strategy**:
- React Three Fiber handles resize automatically with built-in throttling
- No additional handling needed, but monitor performance
- If issues arise, implement additional debouncing

## Testing Strategy

### Overview

The testing strategy employs a dual approach combining unit tests for specific scenarios and property-based tests for comprehensive input coverage. This ensures both concrete edge cases and general correctness properties are validated.

### Unit Testing

**Framework**: Vitest + React Testing Library + @testing-library/react-three-fiber

**Focus Areas**:
1. **Component Rendering**: Verify component mounts without errors
2. **Prop Handling**: Test specific prop combinations and edge cases
3. **Error Boundaries**: Test error handling with mocked failures
4. **Event Handlers**: Test specific user interactions
5. **Ref API**: Test imperative methods exposed via ref
6. **Loading States**: Test Suspense fallback behavior

**Example Unit Tests**:

```typescript
describe('EarthGlobe Component', () => {
  it('renders without crashing', () => {
    render(<EarthGlobe />);
    expect(screen.getByRole('img', { name: /3D Earth globe/i })).toBeInTheDocument();
  });
  
  it('applies custom className', () => {
    const { container } = render(<EarthGlobe className="custom-class" />);
    expect(container.firstChild).toHaveClass('custom-class');
  });
  
  it('disables auto-rotation when prop is set', () => {
    render(<EarthGlobe disableAutoRotation={true} />);
    // Verify auto-rotation is not active
  });
  
  it('calls onLoad callback when texture loads', async () => {
    const onLoad = vi.fn();
    render(<EarthGlobe onLoad={onLoad} />);
    await waitFor(() => expect(onLoad).toHaveBeenCalledTimes(1));
  });
  
  it('displays fallback when WebGL is not supported', () => {
    // Mock WebGL unavailability
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    render(<EarthGlobe />);
    expect(screen.getByText(/WebGL Not Supported/i)).toBeInTheDocument();
  });
  
  it('displays loading indicator while texture loads', () => {
    render(<EarthGlobe />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
  
  it('exposes ref API methods', () => {
    const ref = React.createRef<EarthGlobeRef>();
    render(<EarthGlobe ref={ref} />);
    expect(ref.current).toHaveProperty('resetView');
    expect(ref.current).toHaveProperty('setCameraPosition');
    expect(ref.current).toHaveProperty('toggleAutoRotation');
  });
});

describe('Earth Internal Component', () => {
  it('pauses auto-rotation on user interaction', () => {
    const { container } = render(<Earth />);
    const canvas = container.querySelector('canvas');
    fireEvent.mouseDown(canvas);
    // Verify auto-rotation state is false
  });
  
  it('resumes auto-rotation after 3 seconds of inactivity', async () => {
    vi.useFakeTimers();
    const { container } = render(<Earth />);
    const canvas = container.querySelector('canvas');
    
    fireEvent.mouseDown(canvas);
    fireEvent.mouseUp(canvas);
    
    vi.advanceTimersByTime(3000);
    // Verify auto-rotation state is true
    
    vi.useRealTimers();
  });
  
  it('handles keyboard navigation', () => {
    render(<Earth />);
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    // Verify rotation changed
  });
  
  it('toggles auto-rotation on spacebar', () => {
    render(<Earth />);
    fireEvent.keyDown(window, { key: ' ' });
    // Verify auto-rotation toggled
  });
});
```

### Property-Based Testing

**Framework**: fast-check (JavaScript property-based testing library)

**Configuration**: Minimum 100 iterations per property test

**Tag Format**: Each test includes a comment: `// Feature: 3d-earth-globe, Property {number}: {property_text}`

**Focus Areas**:
1. **Input Validation**: Test component behavior across wide range of prop values
2. **Interaction Handling**: Test various interaction patterns and sequences
3. **State Transitions**: Test auto-rotation state machine with random interactions
4. **Responsive Behavior**: Test resize handling across viewport sizes
5. **Resource Management**: Test mount/unmount cycles

**Example Property Tests**:

```typescript
import fc from 'fast-check';

describe('EarthGlobe Property Tests', () => {
  // Feature: 3d-earth-globe, Property 4: Aspect Ratio Preservation on Resize
  it('maintains aspect ratio for any viewport dimensions', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 3840 }),
        fc.integer({ min: 240, max: 2160 }),
        (width, height) => {
          const { container } = render(<EarthGlobe />);
          
          // Simulate resize
          act(() => {
            window.innerWidth = width;
            window.innerHeight = height;
            window.dispatchEvent(new Event('resize'));
          });
          
          const canvas = container.querySelector('canvas');
          const aspect = canvas.width / canvas.height;
          const expectedAspect = width / height;
          
          expect(Math.abs(aspect - expectedAspect)).toBeLessThan(0.01);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Feature: 3d-earth-globe, Property 9: Zoom Constraints
  it('respects zoom bounds for any scroll amount', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000, max: 1000 }),
        (scrollDelta) => {
          const { container } = render(<Earth />);
          const canvas = container.querySelector('canvas');
          
          // Simulate scroll
          fireEvent.wheel(canvas, { deltaY: scrollDelta });
          
          // Get camera distance (would need to expose this for testing)
          const distance = getCameraDistance();
          
          expect(distance).toBeGreaterThanOrEqual(1.5);
          expect(distance).toBeLessThanOrEqual(10);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Feature: 3d-earth-globe, Property 10: Auto-Rotation Resume After Inactivity
  it('resumes auto-rotation after 3 seconds for any interaction type', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('mousedown', 'wheel', 'touchstart', 'keydown'),
        (eventType) => {
          vi.useFakeTimers();
          const { container } = render(<Earth />);
          const canvas = container.querySelector('canvas');
          
          // Simulate interaction
          fireEvent[eventType](canvas, {});
          
          // Verify auto-rotation is paused
          expect(getAutoRotationState()).toBe(false);
          
          // Advance time
          vi.advanceTimersByTime(3000);
          
          // Verify auto-rotation resumed
          expect(getAutoRotationState()).toBe(true);
          
          vi.useRealTimers();
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Feature: 3d-earth-globe, Property 18: Geometry and Material Memoization
  it('reuses geometry and materials across re-renders', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }),
        (rerenderCount) => {
          const { rerender } = render(<Earth />);
          const initialGeometry = getGeometryInstance();
          const initialMaterial = getMaterialInstance();
          
          // Re-render multiple times
          for (let i = 0; i < rerenderCount; i++) {
            rerender(<Earth />);
          }
          
          const finalGeometry = getGeometryInstance();
          const finalMaterial = getMaterialInstance();
          
          // Verify same instances
          expect(finalGeometry).toBe(initialGeometry);
          expect(finalMaterial).toBe(initialMaterial);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Feature: 3d-earth-globe, Property 20: ClassName Prop Application
  it('applies any valid className to container', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        (className) => {
          const { container } = render(<EarthGlobe className={className} />);
          expect(container.firstChild).toHaveClass(className);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Feature: 3d-earth-globe, Property 28: Multi-Format Texture Support
  it('loads textures with any supported format', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('jpg', 'png', 'webp'),
        async (format) => {
          const texturePath = `/textures/earth.${format}`;
          render(<Earth texturePath={texturePath} />);
          
          await waitFor(() => {
            expect(getTextureLoaded()).toBe(true);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
  
  // Feature: 3d-earth-globe, Property 29: Initial Camera Configuration Props
  it('positions camera according to any valid initial props', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.float({ min: -100, max: 100 }),
          fc.float({ min: -100, max: 100 }),
          fc.float({ min: 1.5, max: 100 })
        ),
        fc.float({ min: 1.5, max: 10 }),
        ([x, y, z], zoom) => {
          render(
            <EarthGlobe
              initialCameraPosition={[x, y, z]}
              initialZoom={zoom}
            />
          );
          
          const cameraPosition = getCameraPosition();
          
          expect(cameraPosition[0]).toBeCloseTo(x, 1);
          expect(cameraPosition[1]).toBeCloseTo(y, 1);
          expect(cameraPosition[2]).toBeCloseTo(z, 1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

**Focus**: Test the component in a realistic application context

**Scenarios**:
1. Component within a responsive layout
2. Multiple instances on the same page
3. Integration with routing (mount/unmount on navigation)
4. Theme switching (light/dark mode)
5. Performance under various device conditions

### Visual Regression Testing

**Tool**: Playwright with screenshot comparison

**Scenarios**:
1. Initial render state
2. After user interaction
3. Loading state
4. Error state
5. Different viewport sizes

### Performance Testing

**Metrics to Monitor**:
1. Initial load time
2. Time to interactive
3. Frame rate (target: 30+ fps)
4. Memory usage
5. Bundle size impact

**Tools**:
- Chrome DevTools Performance panel
- Lighthouse
- Bundle analyzer (webpack-bundle-analyzer or similar)

### Accessibility Testing

**Tools**: axe-core, WAVE

**Checks**:
1. ARIA labels present and descriptive
2. Keyboard navigation functional
3. Focus management
4. Color contrast (for UI elements)
5. Screen reader compatibility

### Test Coverage Goals

- **Unit Test Coverage**: 80%+ line coverage
- **Property Test Coverage**: All identified correctness properties
- **Integration Test Coverage**: All major user workflows
- **Accessibility**: 100% WCAG 2.1 Level AA compliance for interactive elements

### Continuous Integration

**CI Pipeline Steps**:
1. Run unit tests
2. Run property-based tests
3. Run integration tests
4. Check test coverage thresholds
5. Run accessibility tests
6. Build production bundle
7. Analyze bundle size
8. Run visual regression tests (on main branch)

### Testing Best Practices

1. **Mock External Dependencies**: Mock texture loading for faster tests
2. **Use Fake Timers**: Control time-based behavior (auto-rotation resume)
3. **Test Isolation**: Each test should be independent
4. **Descriptive Test Names**: Clearly state what is being tested
5. **Arrange-Act-Assert**: Follow AAA pattern for clarity
6. **Property Test Shrinking**: Let fast-check find minimal failing cases
7. **Performance Budgets**: Fail tests if performance degrades
8. **Accessibility First**: Include a11y checks in every test suite

