import { useMemo } from 'react';
import * as THREE from 'three';

const STAR_COUNT = 4800;
const STAR_RADIUS = 20;

function createCircleTexture(): THREE.CanvasTexture {
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;
  ctx.beginPath();
  ctx.arc(half, half, half, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  return new THREE.CanvasTexture(canvas);
}

export default function Starfield() {
  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(STAR_COUNT * 3);

    for (let i = 0; i < STAR_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = STAR_RADIUS * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = STAR_RADIUS * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = STAR_RADIUS * Math.cos(phi);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const circleMap = createCircleTexture();

    const mat = new THREE.PointsMaterial({
      color: '#eeeeee',
      size: 0.18,
      sizeAttenuation: true,
      transparent: true,
      opacity: .75,
      depthWrite: false,
      map: circleMap,
      alphaMap: circleMap,
    });

    return { geometry: geo, material: mat };
  }, []);

  return <points geometry={geometry} material={material} />;
}
