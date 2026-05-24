// SolidGlobeFallback - Fallback component when texture loading fails
import { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Fallback component that displays a solid-colored sphere
 * when the Earth texture fails to load.
 */
export default function SolidGlobeFallback() {
  // Memoize sphere geometry
  const sphereGeometry = useMemo(
    () => new THREE.SphereGeometry(1, 64, 64),
    []
  );

  // Memoize solid material
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({
      color: '#4a90e2', // Blue color representing Earth
      roughness: 0.8,
      metalness: 0.2,
    }),
    []
  );

  return (
    <>
      {/* Ambient light */}
      <ambientLight color="#ffffff" intensity={0.4} />
      
      {/* Directional light */}
      <directionalLight
        color="#ffffff"
        intensity={1.0}
        position={[5, 3, 5]}
      />
      
      {/* Solid sphere mesh */}
      <mesh geometry={sphereGeometry} material={material} />
      
      {/* Error message overlay (positioned in 3D space) */}
      <group position={[0, -1.5, 0]}>
        <mesh>
          <planeGeometry args={[3, 0.5]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.7} />
        </mesh>
      </group>
    </>
  );
}
