// CityMarker - 3D marker for city locations on the globe
import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useState } from 'react';
import * as THREE from 'three';
import type { CitySubreddit } from '../../data/citySubreddits';
import { useRedditTopPost } from '../../hooks/useRedditTopPost';
import { MARKER_COLORS } from './constants';

interface CityMarkerProps {
  city: CitySubreddit;
  globeRadius?: number;
}

/**
 * Converts latitude and longitude to 3D coordinates on a sphere
 */
function latLongToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

/**
 * Decode HTML entities in a string (e.g., &amp; -> &, &lt; -> <)
 */
function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

export default function CityMarker({ city, globeRadius = 1 }: CityMarkerProps) {
  const [hovered, setHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera } = useThree();

  // Fetch top post only when hovered
  const { post, loading, error } = useRedditTopPost(city.subreddit, hovered);

  // Calculate position on globe surface
  const position = latLongToVector3(city.latitude, city.longitude, globeRadius + 0.01);

  // Check if marker is facing the camera (visible on front side of globe)
  useFrame(() => {
    if (!meshRef.current) return;

    // Update world matrix to ensure we get the correct transformed position
    meshRef.current.updateWorldMatrix(true, false);

    // Get world position of the marker (accounts for parent Earth rotation)
    const worldPosition = new THREE.Vector3();
    meshRef.current.getWorldPosition(worldPosition);

    // Get direction from camera to marker
    const directionToMarker = worldPosition.clone().sub(camera.position).normalize();
    
    // Get the normal vector of the marker (pointing outward from globe center)
    const markerNormal = worldPosition.clone().normalize();
    
    // Calculate dot product - if positive, marker is facing away from camera
    const dotProduct = directionToMarker.dot(markerNormal);
    
    // Marker is visible if dot product is negative (facing camera)
    const visible = dotProduct < 0;
    
    setIsVisible(visible);
    
    // If marker becomes invisible, clear hover state
    if (!visible && hovered) {
      setHovered(false);
    }
  });

  return (
    <group position={position}>
      {/* Marker pin - only render when visible */}
      {isVisible && (
        <mesh
          ref={meshRef}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHovered(false);
            document.body.style.cursor = 'auto';
          }}
          onClick={(e) => {
            e.stopPropagation();
            // Open the post URL if available and valid
            if (post?.url && post.url.startsWith('http')) {
              window.open(post.url, '_blank', 'noopener,noreferrer');
            } else {
              // Fallback to subreddit homepage
              window.open(`https://www.reddit.com/r/${city.subreddit}`, '_blank', 'noopener,noreferrer');
            }
          }}
        >
          {/* Larger invisible sphere for easier hovering */}
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshBasicMaterial 
            transparent
            opacity={0}
          />
          
          {/* Visible marker (smaller, centered) */}
          <mesh>
            <sphereGeometry args={[0.01, 8, 8]} />
            <meshBasicMaterial 
              color={hovered ? MARKER_COLORS.hover : MARKER_COLORS.default} 
            />
          </mesh>
        </mesh>
      )}
      
      {/* Hidden mesh for position tracking when not visible */}
      {!isVisible && (
        <mesh ref={meshRef} visible={false}>
          <sphereGeometry args={[0.01, 8, 8]} />
        </mesh>
      )}

      {/* Tooltip on hover */}
      {isVisible && (
        <Html 
          position={[0, 0, 0]}
          distanceFactor={5}
          style={{ 
            pointerEvents: 'none',
            transformOrigin: 'left center',
            transition: 'opacity 240ms ease-in-out',
            opacity: hovered ? 1 : 0,
            marginLeft: '15px',
          }}
        >
          <div style={{ transform: 'scale(0.4)', transformOrigin: 'left top' }} className="bg-gray-900/95 text-white rounded-lg shadow-lg pointer-events-none w-[400px] text-[14px]">
            {/* Subreddit info */}
            <div className="px-3 py-2 border-b border-gray-700">
              <div className="font-semibold text-sm">r/{city.subreddit}</div>
              <div className="text-gray-300 text-xs">
                {city.city}, {city.country}
              </div>
            </div>

            {/* Top post */}
            {loading && (
              <div className="px-3 py-2 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-gray-600 border-t-white rounded-full animate-spin"></div>
              </div>
            )}

            {!loading && post && (
              <div className="p-3">
                <div className="flex gap-3">
                  {/* Thumbnail on left */}
                  {post.thumbnail && (
                    <img
                      src={post.thumbnail}
                      alt="Post thumbnail"
                      className="w-24 h-24 object-cover rounded flex-shrink-0"
                      onError={(e) => {
                        // Hide image if it fails to load
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}

                  {/* Post content on right */}
                  <div className="flex-1 min-w-0">
                    {/* Post title */}
                    <div className="text-xs font-medium mb-2 line-clamp-3 leading-relaxed">
                      {decodeHtmlEntities(post.title)}
                    </div>

                    {/* Post metadata */}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>↑ {post.score}</span>
                      <span>💬 {post.num_comments}</span>
                    </div>
                    
                    {/* Author */}
                    <div className="text-xs text-gray-500 mt-1">
                      by u/{post.author}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!loading && !post && error && (
              <div className="px-3 py-2 text-gray-400 text-xs">
                <div className="flex items-start gap-1">
                  <span className="text-yellow-400">⚠️</span>
                  <span>{error}</span>
                </div>
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}
