# EarthGlobe Component

An interactive 3D Earth globe component built with React, TypeScript, Three.js, and React Three Fiber.

## Features

- 🌍 **Realistic 3D Earth visualization** with high-quality textures
- 🖱️ **Interactive controls** - drag to rotate, scroll to zoom
- ⌨️ **Keyboard navigation** - arrow keys and spacebar support
- 📱 **Touch support** - works on mobile and tablet devices
- 🎨 **Theme-aware** - automatically adapts to light/dark themes
- ♿ **Accessible** - ARIA labels and keyboard navigation
- 🚀 **High performance** - 30+ FPS with hardware acceleration
- 🔧 **Programmatic control** - ref API for external control
- 🛡️ **Error handling** - graceful fallbacks for WebGL issues

## Installation

The component requires the following dependencies:

```bash
npm install three @react-three/fiber @react-three/drei
npm install -D @types/three
```

## Basic Usage

```tsx
import EarthGlobe from './components/EarthGlobe/EarthGlobe';

function App() {
  return (
    <div className="w-full h-screen">
      <EarthGlobe className="w-full h-full" />
    </div>
  );
}
```

## Props

### `className?: string`

Custom CSS class for the container element. Use this to control the size and positioning of the globe.

```tsx
<EarthGlobe className="w-full h-96 rounded-lg shadow-xl" />
```

### `initialCameraPosition?: [number, number, number]`

Initial camera position in 3D space `[x, y, z]`. The globe is centered at `[0, 0, 0]` with a radius of 1 unit.

**Default:** `[0, 0, 5]`

```tsx
// View from the side
<EarthGlobe initialCameraPosition={[5, 0, 0]} />

// View from above
<EarthGlobe initialCameraPosition={[0, 5, 0]} />
```

### `initialZoom?: number`

Initial zoom level (camera distance from globe). Must be between 1.5 (minimum) and 10 (maximum).

**Default:** `5`

```tsx
// Close-up view
<EarthGlobe initialZoom={2} />

// Distant view
<EarthGlobe initialZoom={8} />
```

### `disableAutoRotation?: boolean`

Disable automatic rotation of the globe. When `false` (default), the globe rotates automatically when idle.

**Default:** `false`

```tsx
<EarthGlobe disableAutoRotation={true} />
```

### `onLoad?: () => void`

Callback fired when the globe is fully loaded and ready. Called after the Earth texture has loaded and the 3D scene is initialized.

```tsx
<EarthGlobe
  onLoad={() => {
    console.log('Globe is ready!');
    setIsLoading(false);
  }}
/>
```

### `backgroundColor?: string`

Background color for the 3D scene. Accepts any valid CSS color string. If not provided, automatically adapts to light/dark theme.

**Default:** Auto-detected based on theme
- Dark theme: `hsl(222.2, 84%, 4.9%)`
- Light theme: `hsl(210, 40%, 96.1%)`

```tsx
// Dark space background
<EarthGlobe backgroundColor="#0a0a0a" />

// Blue atmosphere
<EarthGlobe backgroundColor="hsl(210, 100%, 20%)" />
```

## Ref API

Use React's `useRef` hook to access methods for controlling the globe programmatically.

```tsx
import { useRef } from 'react';
import type { EarthGlobeRef } from './components/EarthGlobe/types';

const globeRef = useRef<EarthGlobeRef>(null);

<EarthGlobe ref={globeRef} />
```

### `resetView()`

Reset camera to the initial position.

```tsx
<button onClick={() => globeRef.current?.resetView()}>
  Reset View
</button>
```

### `setCameraPosition(position: [number, number, number])`

Programmatically set the camera position.

```tsx
// Move to top view
<button onClick={() => globeRef.current?.setCameraPosition([0, 5, 0])}>
  Top View
</button>

// Move to side view
<button onClick={() => globeRef.current?.setCameraPosition([5, 0, 0])}>
  Side View
</button>
```

### `toggleAutoRotation(enabled: boolean)`

Toggle automatic rotation on or off.

```tsx
const [rotating, setRotating] = useState(true);

<button onClick={() => {
  const newState = !rotating;
  setRotating(newState);
  globeRef.current?.toggleAutoRotation(newState);
}}>
  {rotating ? 'Stop' : 'Start'} Rotation
</button>
```

## Keyboard Controls

- **Arrow Left/Right** - Rotate globe horizontally
- **Arrow Up/Down** - Rotate globe vertically
- **Spacebar** - Toggle auto-rotation
- **Mouse Drag** - Rotate in any direction
- **Mouse Wheel** - Zoom in/out
- **Touch Drag** - Rotate on touch devices
- **Pinch** - Zoom on touch devices

## Examples

### Full-Featured Example

```tsx
import { useRef, useState } from 'react';
import EarthGlobe from './components/EarthGlobe/EarthGlobe';
import type { EarthGlobeRef } from './components/EarthGlobe/types';

function GlobeDemo() {
  const globeRef = useRef<EarthGlobeRef>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [autoRotation, setAutoRotation] = useState(true);

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Globe Container */}
      <div className="flex-1">
        <EarthGlobe
          ref={globeRef}
          className="w-full h-full"
          initialCameraPosition={[3, 2, 4]}
          initialZoom={4}
          backgroundColor="#0a0a0a"
          onLoad={() => setIsLoaded(true)}
        />
      </div>

      {/* Control Panel */}
      <div className="p-4 bg-gray-800 flex gap-2">
        <button
          onClick={() => globeRef.current?.resetView()}
          disabled={!isLoaded}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-600"
        >
          Reset View
        </button>
        <button
          onClick={() => globeRef.current?.setCameraPosition([0, 5, 0])}
          disabled={!isLoaded}
          className="px-4 py-2 bg-green-600 text-white rounded disabled:bg-gray-600"
        >
          Top View
        </button>
        <button
          onClick={() => {
            const newState = !autoRotation;
            setAutoRotation(newState);
            globeRef.current?.toggleAutoRotation(newState);
          }}
          disabled={!isLoaded}
          className="px-4 py-2 bg-purple-600 text-white rounded disabled:bg-gray-600"
        >
          {autoRotation ? 'Stop' : 'Start'} Rotation
        </button>
      </div>
    </div>
  );
}
```

### Responsive Layout

```tsx
<div className="container mx-auto p-4">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Small globe */}
    <div className="h-64">
      <EarthGlobe className="w-full h-full" />
    </div>
    
    {/* Large globe */}
    <div className="h-96">
      <EarthGlobe className="w-full h-full" initialZoom={3} />
    </div>
  </div>
</div>
```

## Performance

- Maintains **30+ FPS** on modern browsers
- Uses **hardware-accelerated WebGL** rendering
- Automatic **resource cleanup** on unmount
- Optimized **texture loading** and caching
- **Memoized** geometry and materials for efficiency

## Browser Support

Requires WebGL support. Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Displays a fallback message on unsupported browsers.

## Accessibility

- **ARIA labels** describe the interactive 3D globe
- **Keyboard navigation** for users who cannot use a mouse
- **Screen reader** compatible
- **Focus management** for interactive elements

## Error Handling

The component gracefully handles:

- **WebGL unavailability** - Shows fallback message with browser upgrade instructions
- **Texture loading failures** - Displays solid-colored sphere with error notification
- **WebGL context loss** - Attempts to restore context automatically
- **Invalid prop values** - Clamps to valid ranges with console warnings

## Troubleshooting

### Globe not appearing

1. Ensure the container has explicit dimensions:
   ```tsx
   <div className="w-full h-screen">
     <EarthGlobe className="w-full h-full" />
   </div>
   ```

2. Check that the Earth texture exists at `public/textures/earth-texture.jpg`

3. Verify WebGL is supported in your browser

### Performance issues

1. Reduce texture resolution if needed
2. Disable auto-rotation: `disableAutoRotation={true}`
3. Check browser console for WebGL warnings
4. Ensure hardware acceleration is enabled in browser settings

### Texture not loading

1. Verify texture path: `public/textures/earth-texture.jpg`
2. Check browser console for 404 errors
3. Ensure texture file format is supported (JPG, PNG, WebP)
4. Check CORS settings if loading from external source

## File Structure

```
src/components/EarthGlobe/
├── EarthGlobe.tsx              # Main component export
├── Earth.tsx                   # Internal 3D scene component
├── types.ts                    # TypeScript interfaces
├── constants.ts                # Configuration constants
├── LoadingFallback.tsx         # Loading state component
├── WebGLErrorBoundary.tsx      # WebGL error handler
├── TextureErrorBoundary.tsx    # Texture error handler
├── SolidGlobeFallback.tsx      # Fallback sphere component
├── EarthGlobeExample.tsx       # Usage examples
└── README.md                   # This file
```

## License

Part of the Vibe Code Starter Template project.
