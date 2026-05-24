// Earth component - Internal 3D scene component
import { OrbitControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import landTopo from 'world-atlas/land-50m.json';
import { citySubreddits } from '../../data/citySubreddits';
import CityMarkers from './CityMarkers';
import Starfield from './Starfield';
import { ORBIT_CONTROLS_CONFIG, getCameraRadius } from './constants';
import type { EarthProps } from './types';

/**
 * Project a [longitude, latitude] coordinate to canvas [x, y]
 * using equirectangular projection.
 */
function project(lon: number, lat: number, width: number, height: number): [number, number] {
  const x = ((lon + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return [x, y];
}

/**
 * Split a ring into segments that don't cross the antimeridian.
 * When a segment jumps more than 180° in longitude, we split there.
 */
function splitRingAtAntimeridian(ring: number[][]): number[][][] {
  const segments: number[][][] = [];
  let current: number[][] = [ring[0]];

  for (let i = 1; i < ring.length; i++) {
    const prevLon = ring[i - 1][0];
    const curLon = ring[i][0];
    if (Math.abs(curLon - prevLon) > 180) {
      // Crossing the antimeridian — split here
      segments.push(current);
      current = [];
    }
    current.push(ring[i]);
  }
  segments.push(current);
  return segments;
}

/**
 * Draw a GeoJSON ring onto a canvas context, handling antimeridian wrapping.
 * Rings that cross ±180° longitude are split into separate sub-paths.
 */
function drawRing(ctx: CanvasRenderingContext2D, ring: number[][], width: number, height: number) {
  if (ring.length === 0) return;

  const segments = splitRingAtAntimeridian(ring);

  for (const seg of segments) {
    if (seg.length === 0) continue;
    const [x0, y0] = project(seg[0][0], seg[0][1], width, height);
    ctx.moveTo(x0, y0);
    for (let i = 1; i < seg.length; i++) {
      const [x, y] = project(seg[i][0], seg[i][1], width, height);
      ctx.lineTo(x, y);
    }
    ctx.closePath();
  }
}

/**
 * Build a canvas texture with flat blue ocean and flat white land
 * using real GeoJSON land boundaries from world-atlas.
 */
function createLandWaterTexture(): THREE.CanvasTexture {
  // Use 4096×2048 for better performance and memory usage
  // This is still 4x higher than the original 2048×1024
  const width = 4096;
  const height = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Fill ocean (blue)
  ctx.fillStyle = '#4a9eff';
  ctx.fillRect(0, 0, width, height);

  // Convert TopoJSON to GeoJSON
  const topo = landTopo as unknown as Topology;
  const land = feature(topo, topo.objects.land as GeometryCollection);

  // Draw land polygons (white)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();

  const geojsonFeatures = land.features;
  for (const feat of geojsonFeatures) {
    const geom = feat.geometry;
    if (geom.type === 'Polygon') {
      for (const ring of geom.coordinates) {
        drawRing(ctx, ring, width, height);
      }
    } else if (geom.type === 'MultiPolygon') {
      for (const polygon of geom.coordinates) {
        for (const ring of polygon) {
          drawRing(ctx, ring, width, height);
        }
      }
    }
  }

  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export default function Earth({ onLoad, disableAutoRotation, onNavigateToCityRef, language = 'en' }: EarthProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const { camera, gl } = useThree();
  const [isTabVisible, setIsTabVisible] = useState(true);
  // Ref to always have the latest disableAutoRotation (showcase toggle) value in closures/timers
  const disableShowcaseRef = useRef(disableAutoRotation);

  // Idle showcase state
  const [showcaseIndex, setShowcaseIndex] = useState<number | null>(null);
  const [showcaseFadingOut, setShowcaseFadingOut] = useState(false);
  // Single timer refs — only ONE of each can exist at a time
  const idleTimerRef = useRef<number | null>(null);
  const showcaseTimerRef = useRef<number | null>(null);
  const fadeOutTimerRef = useRef<number | null>(null);
  const showcaseActiveRef = useRef(false);
  const showcaseHistoryRef = useRef<number[]>([]);
  const markerHoveredRef = useRef(false);
  // Smooth camera animation state (spherical coordinates)
  const targetSphericalRef = useRef<{ theta: number; phi: number } | null>(null);
  const startSphericalRef = useRef<{ theta: number; phi: number } | null>(null);
  const animStartTimeRef = useRef<number>(0);
  const isAnimatingRef = useRef(false);
  const ANIM_DURATION = 2400; // ms — showcase transition duration
  const INTRO_ANIM_DURATION = 2000; // ms — initial geolocation reveal
  const FADE_OUT_DURATION = 300; // ms
  const IDLE_TIMEOUT = 14000;
  const SHOWCASE_INTERVAL = 8000;
  const INITIAL_DELAY = 4000; // ms before showcase starts on page load
  const INTRO_FADE_DURATION = 1200; // ms — opacity fade-in during intro
  const introAnimDoneRef = useRef(false);
  const introFadeStartRef = useRef<number | null>(null);
  const [markerOpacity, setMarkerOpacity] = useState(0);
  const userGeoRef = useRef<{ lat: number; lon: number } | null>(null);
  const [introSpinDone, setIntroSpinDone] = useState(false);
  const introSpinDoneRef = useRef(false);

  // Responsive camera radius — adjusts when viewport is portrait
  const cameraRadiusRef = useRef(getCameraRadius(window.innerWidth, window.innerHeight));
  useEffect(() => {
    const handleResize = () => {
      const newRadius = getCameraRadius(window.innerWidth, window.innerHeight);
      cameraRadiusRef.current = newRadius;
      // If not animating, update camera position immediately
      if (!isAnimatingRef.current) {
        const sph = new THREE.Spherical().setFromVector3(camera.position);
        sph.radius = newRadius;
        camera.position.setFromSpherical(sph);
        camera.lookAt(0, 0, 0);
        const controls = controlsRef.current;
        if (controls) {
          controls.target.set(0, 0, 0);
          controls.update();
        }
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [camera]);

  // Helper: compute camera spherical coords to face a given lat/lon
  const latLonToCameraSpherical = (lat: number, lon: number) => {
    const phiGeo = (90 - lat) * (Math.PI / 180);
    const thetaGeo = (lon + 180) * (Math.PI / 180);
    const dir = new THREE.Vector3(
      -(Math.sin(phiGeo) * Math.cos(thetaGeo)),
      Math.cos(phiGeo),
      Math.sin(phiGeo) * Math.sin(thetaGeo)
    ).normalize();
    const sph = new THREE.Spherical().setFromVector3(dir);
    sph.phi = Math.max(
      ORBIT_CONTROLS_CONFIG.minPolarAngle,
      Math.min(ORBIT_CONTROLS_CONFIG.maxPolarAngle, sph.phi)
    );
    return { theta: sph.theta, phi: sph.phi };
  };

  // Centralized timer clearing — always call this before setting any new timer
  const clearAllShowcaseTimers = () => {
    if (idleTimerRef.current !== null) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
    if (showcaseTimerRef.current !== null) {
      clearTimeout(showcaseTimerRef.current);
      showcaseTimerRef.current = null;
    }
    if (fadeOutTimerRef.current !== null) {
      clearTimeout(fadeOutTimerRef.current);
      fadeOutTimerRef.current = null;
    }
  };

  // Keep ref in sync and react to showcase toggle changes
  useEffect(() => {
    disableShowcaseRef.current = disableAutoRotation;
    // Skip the initial mount — the mount effect handles startup with INITIAL_DELAY
    if (!introAnimDoneRef.current) return;
    if (disableAutoRotation) {
      // Stop the showcase cycle — hide tooltip, cancel future transitions,
      // but let any in-progress camera animation finish naturally
      showcaseActiveRef.current = false;
      setShowcaseIndex(null);
      setShowcaseFadingOut(false);
      clearAllShowcaseTimers();
      // NOTE: we intentionally do NOT set isAnimatingRef = false here,
      // so the camera finishes spinning to its current destination
    } else {
      // Re-enable: start showcase immediately (no idle delay)
      startShowcase();
    }
  }, [disableAutoRotation]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle tab visibility to pause rendering when tab is hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Create the land/water texture once — starts fully transparent for intro fade
  const { material, texture } = useMemo(() => {
    const tex = createLandWaterTexture();
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      toneMapped: false,
      transparent: true,
      opacity: 0,
    });
    return { material: mat, texture: tex };
  }, []);

  // Signal load complete
  useEffect(() => {
    onLoad?.();
  }, [onLoad]);

  // Memoize sphere geometry
  const sphereGeometry = useMemo(
    () => new THREE.SphereGeometry(1, 64, 64),
    []
  );

  // Process city data to handle duplicate coordinates (must be before showcase logic)
  const processedCities = useMemo(() => {
    const coordMap = new Map<string, number>();
    
    return citySubreddits.map((city) => {
      const coordKey = `${city.latitude.toFixed(4)},${city.longitude.toFixed(4)}`;
      const count = coordMap.get(coordKey) || 0;
      coordMap.set(coordKey, count + 1);
      
      if (count > 0) {
        const angle = (count * 2 * Math.PI) / 8;
        const offsetDegrees = 0.15;
        
        return {
          ...city,
          latitude: city.latitude + offsetDegrees * Math.sin(angle),
          longitude: city.longitude + offsetDegrees * Math.cos(angle),
        };
      }
      
      return city;
    });
  }, []);

  // Cleanup resources on unmount
  useEffect(() => {
    return () => {
      sphereGeometry.dispose();
      material.dispose();
      texture.dispose();
      clearAllShowcaseTimers();
    };
  }, [sphereGeometry, material, texture]);

  // Pick a random city index, excluding the last 100 visited
  const pickRandomCity = () => {
    const count = processedCities.length;
    if (count === 0) return;
    const history = showcaseHistoryRef.current;
    const historySet = new Set(history);
    const eligible: number[] = [];
    for (let i = 0; i < count; i++) {
      if (!historySet.has(i)) eligible.push(i);
    }
    const idx = eligible.length > 0
      ? eligible[Math.floor(Math.random() * eligible.length)]
      : Math.floor(Math.random() * count);
    history.push(idx);
    if (history.length > 100) history.shift();

    const city = processedCities[idx];
    const target = latLonToCameraSpherical(city.latitude, city.longitude);

    // Get current camera spherical
    const currentSph = new THREE.Spherical().setFromVector3(camera.position);

    targetSphericalRef.current = target;
    startSphericalRef.current = { theta: currentSph.theta, phi: currentSph.phi };
    animStartTimeRef.current = performance.now();
    isAnimatingRef.current = true;
    setShowcaseIndex(idx);
  };

  // Start the showcase cycle — picks first city, then schedules the NEXT transition
  const startShowcase = () => {
    clearAllShowcaseTimers();
    showcaseActiveRef.current = true;
    pickRandomCity();
    scheduleNextShowcaseCity();
  };

  // Schedule the next city transition (fade-out → pick → schedule again)
  const scheduleNextShowcaseCity = () => {
    // Clear any existing showcase/fade timers to prevent duplicates
    if (fadeOutTimerRef.current !== null) {
      clearTimeout(fadeOutTimerRef.current);
      fadeOutTimerRef.current = null;
    }
    if (showcaseTimerRef.current !== null) {
      clearTimeout(showcaseTimerRef.current);
      showcaseTimerRef.current = null;
    }
    // Start fade-out SHOWCASE_INTERVAL - FADE_OUT_DURATION ms from now
    fadeOutTimerRef.current = window.setTimeout(() => {
      fadeOutTimerRef.current = null;
      if (!showcaseActiveRef.current) return;
      setShowcaseFadingOut(true);
      // After fade-out completes, pick next city and schedule again
      showcaseTimerRef.current = window.setTimeout(() => {
        showcaseTimerRef.current = null;
        if (!showcaseActiveRef.current) return;
        setShowcaseFadingOut(false);
        pickRandomCity();
        scheduleNextShowcaseCity();
      }, FADE_OUT_DURATION);
    }, SHOWCASE_INTERVAL - FADE_OUT_DURATION);
  };

  // Stop the showcase — clear all timers, clamp camera, re-sync OrbitControls
  const stopShowcase = () => {
    showcaseActiveRef.current = false;
    isAnimatingRef.current = false;
    targetSphericalRef.current = null;
    setShowcaseIndex(null);
    setShowcaseFadingOut(false);
    clearAllShowcaseTimers();
    // Clamp camera phi to polar limits so OrbitControls starts clean
    const sph = new THREE.Spherical().setFromVector3(camera.position);
    sph.radius = cameraRadiusRef.current;
    sph.phi = Math.max(
      ORBIT_CONTROLS_CONFIG.minPolarAngle,
      Math.min(ORBIT_CONTROLS_CONFIG.maxPolarAngle, sph.phi)
    );
    camera.position.setFromSpherical(sph);
    camera.lookAt(0, 0, 0);

    // Re-sync OrbitControls with current camera — use update() instead of
    // saveState()/reset() to avoid desynchronizing the controls' internal state
    const controls = controlsRef.current;
    if (controls) {
      controls.target.set(0, 0, 0);
      controls.update();
    }
  };

  // Schedule idle timer — starts showcase after IDLE_TIMEOUT if no interaction
  const scheduleIdleTimer = () => {
    // Don't schedule anything if showcase is disabled
    if (disableShowcaseRef.current) return;
    // Clear any existing timers first to prevent stacking
    clearAllShowcaseTimers();
    idleTimerRef.current = window.setTimeout(() => {
      if (!markerHoveredRef.current && !disableShowcaseRef.current) {
        startShowcase();
      }
    }, IDLE_TIMEOUT);
  };

  // Reset the idle timer (called on any user interaction)
  const resetIdleTimer = () => {
    // Mark intro as done so the useFrame completion code never re-sets
    // the geolocation tooltip after any user interaction
    introAnimDoneRef.current = true;
    // Safety: ensure markerHoveredRef doesn't get stuck
    markerHoveredRef.current = false;
    // If showcase is active, stop it fully
    if (showcaseActiveRef.current) {
      stopShowcase();
    } else {
      // Even if showcase isn't active yet (e.g. during intro delay),
      // clear the showcase tooltip so it doesn't linger after interaction
      setShowcaseIndex(null);
      setShowcaseFadingOut(false);
      clearAllShowcaseTimers();
    }
    scheduleIdleTimer();
  };

  // Listen for user activity on the canvas to detect idle — runs once on mount
  // Listen for any user activity to interrupt showcase and reset idle timer.
  // mousemove on window so cursor movement anywhere on the page interrupts.
  // mousedown/touchstart on canvas (capture phase) so OrbitControls can immediately drag.
  useEffect(() => {
    const canvas = gl.domElement;
    // Block all pointer interaction during intro spin
    canvas.style.pointerEvents = 'none';
    const canvasHandler = () => {
      // Ignore interactions during intro spin
      if (!introSpinDoneRef.current) return;
      resetIdleTimer();
    };
    canvas.addEventListener('mousedown', canvasHandler, true);
    canvas.addEventListener('touchstart', canvasHandler, true);

    // Fetch user geolocation and start intro animation
    const abortController = new AbortController();

    // Helper: start intro animation to a given lat/lon
    const startIntroAnimation = (lat: number, lon: number) => {
      userGeoRef.current = { lat, lon };
      const userTarget = latLonToCameraSpherical(lat, lon);
      const oppTheta = userTarget.theta + Math.PI;
      const CAMERA_RADIUS = cameraRadiusRef.current;
      const startSph = new THREE.Spherical(CAMERA_RADIUS, userTarget.phi, oppTheta);
      camera.position.setFromSpherical(startSph);
      camera.lookAt(0, 0, 0);
      const controls = controlsRef.current;
      if (controls) {
        controls.target.set(0, 0, 0);
        controls.saveState();
        controls.reset();
      }
      targetSphericalRef.current = userTarget;
      startSphericalRef.current = { theta: oppTheta, phi: userTarget.phi };
      animStartTimeRef.current = performance.now();
      isAnimatingRef.current = true;
      introFadeStartRef.current = performance.now();
    };

    // Pick a random city for fallback
    const useRandomCityFallback = () => {
      if (processedCities.length === 0) {
        introFadeStartRef.current = performance.now();
        return;
      }
      const randomCity = processedCities[Math.floor(Math.random() * processedCities.length)];
      startIntroAnimation(randomCity.latitude, randomCity.longitude);
    };

    fetch('https://ipapi.co/json/', { signal: abortController.signal })
      .then(res => res.json())
      .then(data => {
        if (data?.latitude && data?.longitude) {
          startIntroAnimation(data.latitude, data.longitude);
        } else {
          // API returned but without valid coordinates — use random city
          useRandomCityFallback();
        }
      })
      .catch(() => {
        // Geolocation failed (rate limit, network, etc.) — use random city
        useRandomCityFallback();
      })
      .finally(() => {
        // After initial delay, mark intro done and start showcase if enabled.
        // Store in idleTimerRef so clearAllShowcaseTimers() can cancel it
        // if the user interacts before the delay elapses.
        idleTimerRef.current = window.setTimeout(() => {
          idleTimerRef.current = null;
          introAnimDoneRef.current = true;
          if (!disableShowcaseRef.current) {
            // Start the showcase cycle — the closest city tooltip is already showing
            // from the intro animation completion, so just schedule the next transition
            showcaseActiveRef.current = true;
            scheduleNextShowcaseCity();
          }
        }, INITIAL_DELAY);
      });

    return () => {
      canvas.removeEventListener('mousedown', canvasHandler, true);
      canvas.removeEventListener('touchstart', canvasHandler, true);
      abortController.abort();
      clearAllShowcaseTimers();
      showcaseActiveRef.current = false;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Enable OrbitControls once intro spin completes
  useEffect(() => {
    const controls = controlsRef.current;
    if (controls && introSpinDone) {
      controls.enabled = true;
    }
    // Also restore pointer events on the canvas
    if (introSpinDone) {
      gl.domElement.style.pointerEvents = '';
    }
  }, [introSpinDone, gl]);

  // Handle interaction events — stop showcase on drag, schedule idle to restart
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const handleInteractionStart = () => {
      // Ignore interactions during intro spin
      if (!introSpinDoneRef.current) return;
      // Mark intro as done so geolocation tooltip can't reappear
      introAnimDoneRef.current = true;
      // Stop showcase if running, otherwise just clear any lingering tooltip
      if (showcaseActiveRef.current) {
        stopShowcase();
      } else {
        setShowcaseIndex(null);
        setShowcaseFadingOut(false);
        clearAllShowcaseTimers();
      }
      scheduleIdleTimer();
    };

    controls.addEventListener('start', handleInteractionStart);
    return () => {
      controls.removeEventListener('start', handleInteractionStart);
    };
  }, []);

  // Showcase animation each frame
  useFrame(() => {
    if (!meshRef.current || !isTabVisible) return;

    // Intro fade-in: animate material opacity from 0 → 1
    if (introFadeStartRef.current !== null && material.opacity < 1) {
      const fadeElapsed = performance.now() - introFadeStartRef.current;
      const opacity = Math.min(fadeElapsed / INTRO_FADE_DURATION, 1);
      material.opacity = opacity;
      setMarkerOpacity(opacity);
      if (opacity >= 1) {
        material.transparent = false;
        introFadeStartRef.current = null;
      }
    }

    // Showcase/intro smooth camera animation
    const controls = controlsRef.current;
    if (isAnimatingRef.current && targetSphericalRef.current && startSphericalRef.current) {
      const target = targetSphericalRef.current;
      const start = startSphericalRef.current;

      // Use intro duration for the initial geolocation reveal, showcase duration otherwise
      const isIntro = !introAnimDoneRef.current;
      const duration = isIntro ? INTRO_ANIM_DURATION : ANIM_DURATION;

      // Time-based progress (0 to 1)
      const elapsed = performance.now() - animStartTimeRef.current;
      const rawT = Math.min(elapsed / duration, 1);

      // Ease-out cubic for intro, ease-in-out cubic for showcase
      const t = isIntro
        ? 1 - Math.pow(1 - rawT, 3)
        : rawT < 0.5
          ? 4 * rawT * rawT * rawT
          : 1 - Math.pow(-2 * rawT + 2, 3) / 2;

      // Compute shortest-path delta for theta (azimuthal angle)
      let dTheta = target.theta - start.theta;
      dTheta = ((dTheta + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;

      const currentTheta = start.theta + dTheta * t;
      const currentPhi = start.phi + (target.phi - start.phi) * t;

      // Use fixed camera radius to avoid drift
      const CAMERA_RADIUS = cameraRadiusRef.current;
      const newSph = new THREE.Spherical(CAMERA_RADIUS, currentPhi, currentTheta);
      camera.position.setFromSpherical(newSph);
      camera.lookAt(0, 0, 0);
      if (controls) {
        controls.target.set(0, 0, 0);
        controls.update();
      }

      if (rawT >= 1) {
        isAnimatingRef.current = false;
        // Mark intro spin complete so OrbitControls become enabled
        if (!introSpinDoneRef.current) {
          introSpinDoneRef.current = true;
          setIntroSpinDone(true);
        }
        // Show closest city tooltip when intro animation completes
        // Only fires during the initial geolocation reveal — once introAnimDoneRef
        // is set (by INITIAL_DELAY timer or any user interaction), this never runs again
        if (!introAnimDoneRef.current && userGeoRef.current && processedCities.length > 0) {
          const { lat, lon } = userGeoRef.current;
          let closestIdx = 0;
          let closestDist = Infinity;
          for (let i = 0; i < processedCities.length; i++) {
            const c = processedCities[i];
            const dLat = c.latitude - lat;
            const dLon = c.longitude - lon;
            const dist = dLat * dLat + dLon * dLon;
            if (dist < closestDist) {
              closestDist = dist;
              closestIdx = i;
            }
          }
          setShowcaseIndex(closestIdx);
        }
        // Sync OrbitControls
        if (controls) {
          controls.saveState();
          controls.reset();
        }
      }
    }
  });

  // Handle marker hover state changes
  const handleMarkerHoverChange = useCallback((isHovering: boolean) => {
    markerHoveredRef.current = isHovering;
    if (isHovering) {
      // User is hovering a marker — stop showcase and clear its tooltip
      // so the showcase tooltip doesn't reappear when hover ends
      if (showcaseActiveRef.current) {
        stopShowcase();
      } else {
        setShowcaseIndex(null);
        setShowcaseFadingOut(false);
        clearAllShowcaseTimers();
      }
    } else {
      // Hover ended — schedule idle timer to restart showcase
      scheduleIdleTimer();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Navigate to a specific city by index (used by search)
  const navigateToCity = useCallback((cityIndex: number) => {
    if (cityIndex < 0 || cityIndex >= processedCities.length) return;
    // Mark intro as done so the useFrame completion code never re-sets
    // the geolocation tooltip after a search navigation
    introAnimDoneRef.current = true;
    // Stop any active showcase
    if (showcaseActiveRef.current) {
      stopShowcase();
    }
    clearAllShowcaseTimers();

    const city = processedCities[cityIndex];
    const target = latLonToCameraSpherical(city.latitude, city.longitude);
    const currentSph = new THREE.Spherical().setFromVector3(camera.position);

    targetSphericalRef.current = target;
    startSphericalRef.current = { theta: currentSph.theta, phi: currentSph.phi };
    animStartTimeRef.current = performance.now();
    isAnimatingRef.current = true;
    setShowcaseIndex(cityIndex);

    // Schedule idle timer so showcase resumes after user stops interacting
    scheduleIdleTimer();
  }, [processedCities, camera]); // eslint-disable-line react-hooks/exhaustive-deps

  // Expose navigateToCity to parent via ref
  useEffect(() => {
    if (onNavigateToCityRef) {
      onNavigateToCityRef.current = navigateToCity;
    }
    return () => {
      if (onNavigateToCityRef) {
        onNavigateToCityRef.current = null;
      }
    };
  }, [navigateToCity, onNavigateToCityRef]);

  return (
    <>
      <mesh ref={meshRef} geometry={sphereGeometry} material={material}>
        <CityMarkers cities={processedCities} globeRadius={1} showcaseIndex={showcaseIndex} showcaseFadingOut={showcaseFadingOut} onHoverChange={handleMarkerHoverChange} markerOpacity={markerOpacity} language={language} />
      </mesh>

      <Starfield />

      <OrbitControls
        ref={controlsRef}
        enabled={introSpinDone}
        enableDamping={ORBIT_CONTROLS_CONFIG.enableDamping}
        dampingFactor={ORBIT_CONTROLS_CONFIG.dampingFactor}
        rotateSpeed={ORBIT_CONTROLS_CONFIG.rotateSpeed}
        minDistance={ORBIT_CONTROLS_CONFIG.minDistance}
        maxDistance={ORBIT_CONTROLS_CONFIG.maxDistance}
        enablePan={ORBIT_CONTROLS_CONFIG.enablePan}
        enableZoom={ORBIT_CONTROLS_CONFIG.enableZoom}
        minPolarAngle={ORBIT_CONTROLS_CONFIG.minPolarAngle}
        maxPolarAngle={ORBIT_CONTROLS_CONFIG.maxPolarAngle}
      />
    </>
  );
}
