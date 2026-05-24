/**
 * Configuration constants for the EarthGlobe component
 * 
 * This module contains all the default configuration values used by the
 * EarthGlobe component, including camera settings, lighting, textures,
 * and interaction controls.
 * 
 * @module constants
 */

/**
 * Default camera configuration
 * 
 * Defines the perspective camera settings for viewing the 3D globe.
 * 
 * @property {number} fov - Field of view in degrees (45° provides natural perspective)
 * @property {number} near - Near clipping plane (objects closer than this are not rendered)
 * @property {number} far - Far clipping plane (objects farther than this are not rendered)
 * @property {[number, number, number]} position - Initial camera position [x, y, z] in world space
 */
export const DEFAULT_CAMERA = {
  fov: 45,
  near: 0.1,
  far: 1000,
  position: [0, 0, 3.35] as [number, number, number],
};

/**
 * Default lighting configuration
 * 
 * Defines the lighting setup for the 3D scene to create realistic Earth visualization.
 * Uses a combination of ambient and directional lighting.
 * 
 * @property {Object} ambient - Ambient light provides soft overall illumination
 * @property {string} ambient.color - Light color (white for neutral lighting)
 * @property {number} ambient.intensity - Light intensity (0.4 for subtle ambient)
 * @property {Object} directional - Directional light simulates sunlight
 * @property {string} directional.color - Light color (white for natural sunlight)
 * @property {number} directional.intensity - Light intensity (1.0 for strong directional)
 * @property {[number, number, number]} directional.position - Light position [x, y, z] (from upper-right)
 */
export const DEFAULT_LIGHTING = {
  ambient: {
    color: '#ffffff',
    intensity: 0.4,
  },
  directional: {
    color: '#ffffff',
    intensity: 1.0,
    position: [5, 3, 5] as [number, number, number],
  },
};

/**
 * Earth texture configuration
 * 
 * Defines the texture asset used for the Earth's surface.
 * The texture should be placed in the public/textures/ directory.
 * 
 * @property {string} path - Path to texture file relative to public directory
 * @property {'jpg'} format - Image format (JPG for compression)
 * @property {'2k'} resolution - Texture resolution (2K = 2048x1024 for balance of quality and performance)
 */
export const EARTH_TEXTURE = {
  path: '/textures/earth-texture.jpg',
  format: 'jpg' as const,
  resolution: '2k' as const,
};

/**
 * OrbitControls configuration
 * 
 * Defines the behavior of user interaction controls for rotating and zooming the globe.
 * 
 * @property {boolean} enableDamping - Enable smooth momentum for camera movement
 * @property {number} dampingFactor - Momentum decay rate (0.05 = smooth deceleration)
 * @property {number} rotateSpeed - Rotation sensitivity multiplier (0.5 = moderate speed)
 * @property {number} minDistance - Minimum camera distance from globe center (prevents going inside)
 * @property {number} maxDistance - Maximum camera distance from globe center (prevents zooming too far)
 * @property {boolean} enablePan - Enable panning (disabled to keep globe centered)
 * @property {boolean} enableZoom - Enable zoom via scroll/pinch
 */
export const ORBIT_CONTROLS_CONFIG = {
  enableDamping: true,
  dampingFactor: 0.05,
  rotateSpeed: 0.5,
  minDistance: 1.5,
  maxDistance: 10,
  enablePan: false,
  enableZoom: false, // Zoom disabled
  minPolarAngle: Math.PI / 6,         // 30° — prevents seeing north pole
  maxPolarAngle: Math.PI - Math.PI / 6, // 150° — prevents seeing south pole
};

/**
 * Marker color configuration
 * 
 * Defines the colors used for city markers on the globe.
 * 
 * @property {string} default - Default marker color (light gray)
 * @property {string} hover - Hovered/active marker color (orange-red)
 */
export const MARKER_COLORS = {
  default: '#fafafa',
  hover: '#FE4418',
};

/**
 * Compute camera radius based on viewport aspect ratio.
 * In portrait mode (height > width), push the camera further out
 * so the globe doesn't fill the entire vertical space.
 * In landscape, use the default distance.
 */
export function getCameraRadius(width: number, height: number): number {
  const baseRadius = DEFAULT_CAMERA.position[2]; // 3.35
  const aspect = width / height;
  if (aspect >= 1) return baseRadius; // landscape or square — default
  // Portrait: linearly increase distance as aspect gets narrower
  // At aspect 0.5 (very tall), radius is ~1.5x the base
  return baseRadius / aspect;
}
