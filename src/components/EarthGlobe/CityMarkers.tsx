// CityMarkers - Optimized instanced rendering for all city markers
import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { CitySubreddit } from '../../data/citySubreddits';
import { useRedditTopPost } from '../../hooks/useRedditTopPost';
import { useTranslation } from '../../hooks/useTranslation';
import { MARKER_COLORS } from './constants';

interface CityMarkersProps {
  cities: CitySubreddit[];
  globeRadius?: number;
  showcaseIndex?: number | null;
  showcaseFadingOut?: boolean;
  onHoverChange?: (isHovering: boolean) => void;
  markerOpacity?: number;
  language?: string;
}

const MARKER_COLOR = new THREE.Color(MARKER_COLORS.default);
const MARKER_HOVER_COLOR = new THREE.Color(MARKER_COLORS.hover);
const tempMatrix = new THREE.Matrix4();
const tempVec3 = new THREE.Vector3();
const tempWorldPos = new THREE.Vector3();
const tempDirection = new THREE.Vector3();
const tempNormal = new THREE.Vector3();

function latLongToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

const ORIGINAL_TITLE_LABEL: Record<string, string> = {
  en: 'Original title:',
  es: 'Título original:',
  fr: 'Titre original\u00a0:',
  de: 'Originaltitel:',
  pt: 'Título original:',
  it: 'Titolo originale:',
  nl: 'Oorspronkelijke titel:',
  ja: '元のタイトル：',
  ko: '원제:',
  zh: '原标题：',
  ru: 'Оригинальное название:',
  ar: 'العنوان الأصلي:',
  hi: 'मूल शीर्षक:',
  sv: 'Originaltitel:',
  pl: 'Oryginalny tytuł:',
  tr: 'Orijinal başlık:',
};

function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

function timeAgo(utcSeconds: number): string {
  const now = Date.now() / 1000;
  const diff = now - utcSeconds;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

function MarkerTooltip({ city, hovered, onPostLoaded, isPortrait, language = 'en' }: { city: CitySubreddit; hovered: boolean; onPostLoaded?: (url: string) => void; isPortrait?: boolean; language?: string }) {
  const { post, loading, error } = useRedditTopPost(city.subreddit, hovered);
  const decodedTitle = post?.title ? decodeHtmlEntities(post.title) : undefined;
  const { translatedText, isTranslating, isTranslated } = useTranslation(decodedTitle, language);
  const fetchAttemptedRef = useRef(false);

  // Determine if the title is ready to display:
  // - If still translating, hide the title
  // - If translation resolved (either translated or same-language), show it
  const titleReady = !isTranslating && decodedTitle !== undefined;

  // Track when a fetch is actually initiated
  useEffect(() => {
    if (loading) {
      fetchAttemptedRef.current = true;
    }
  }, [loading]);

  useEffect(() => {
    if (post?.url) {
      onPostLoaded?.(post.url);
    }
  }, [post?.url, onPostLoaded]);

  useEffect(() => {
    if (!loading && !post && error) {
      console.warn(`r/${city.subreddit}: ${error}`);
    }
    if (!loading && !post && !error && fetchAttemptedRef.current) {
      console.warn(`r/${city.subreddit}: no post data retrieved`);
    }
  }, [loading, post, error, city.subreddit]);

  return (
    <div
      style={{ transform: 'scale(0.4)', transformOrigin: isPortrait ? 'center top' : 'left top' }}
      className="bg-white text-gray-900 rounded-2xl shadow-xl pointer-events-none w-[640px] text-[14px] pb-3"
    >
      <div className="px-4 pt-2 pb-1">
        <div className="font-semibold text-sm">r/{city.subreddit}</div>
        <div className="text-gray-400 text-xs">{city.city}, {city.country}</div>
      </div>

      {loading && (
        <div className="px-4 py-2 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
        </div>
      )}

      {!loading && post && (
        <div className="px-4 py-1">
          <div className="flex gap-4">
            {post.thumbnail && (
              <img
                src={post.thumbnail}
                alt="Post thumbnail"
                className="w-40 h-40 object-cover rounded flex-shrink-0 mt-3"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            )}
            <div className="flex-1 min-w-0">
              {titleReady ? (
                <>
                  <div className="text-6xl font-medium mb-3 line-clamp-6 leading-none pb-1">
                    {isTranslated ? translatedText : decodedTitle}
                  </div>
                  {isTranslated && decodedTitle && (
                    <div className="text-sm text-gray-500 mb-2 line-clamp-2">
                      {ORIGINAL_TITLE_LABEL[language] || ORIGINAL_TITLE_LABEL.en} {decodedTitle}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center py-4">
                  <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
                </div>
              )}
              <div className="text-xs text-gray-400">
                <span>{timeAgo(post.created_utc)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && !post && error && (
        <div className="px-4 py-2 text-gray-500 text-xs">
          <div className="flex items-start gap-1">
            <span className="text-yellow-400">⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CityMarkers({ cities, globeRadius = 1, showcaseIndex = null, showcaseFadingOut = false, onHoverChange, markerOpacity = 1, language = 'en' }: CityMarkersProps) {
  const { camera } = useThree();
  const instancedRef = useRef<THREE.InstancedMesh>(null);
  const hitMeshRef = useRef<THREE.InstancedMesh>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const visibilityRef = useRef<boolean[]>(new Array(cities.length).fill(true));
  const positionsRef = useRef<THREE.Vector3[]>([]);

  // Precompute positions
  const positions = useMemo(() => {
    return cities.map(city => latLongToVector3(city.latitude, city.longitude, globeRadius + 0.01));
  }, [cities, globeRadius]);

  useEffect(() => {
    positionsRef.current = positions;
  }, [positions]);

  // Shared geometry and materials
  const markerGeometry = useMemo(() => new THREE.SphereGeometry(0.01, 8, 8), []);
  const hitGeometry = useMemo(() => new THREE.SphereGeometry(0.02, 8, 8), []);
  const markerMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 }), []);
  const hitMaterial = useMemo(() => new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }), []);

  // Set initial instance transforms
  useEffect(() => {
    const instanced = instancedRef.current;
    const hitMesh = hitMeshRef.current;
    if (!instanced || !hitMesh) return;

    for (let i = 0; i < positions.length; i++) {
      tempMatrix.makeTranslation(positions[i].x, positions[i].y, positions[i].z);
      instanced.setMatrixAt(i, tempMatrix);
      hitMesh.setMatrixAt(i, tempMatrix);
      instanced.setColorAt(i, MARKER_COLOR);
    }
    instanced.instanceMatrix.needsUpdate = true;
    hitMesh.instanceMatrix.needsUpdate = true;
    if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true;
  }, [positions]);

  // Cleanup
  useEffect(() => {
    return () => {
      markerGeometry.dispose();
      hitGeometry.dispose();
      markerMaterial.dispose();
      hitMaterial.dispose();
      if (hoverEndTimerRef.current !== null) {
        clearTimeout(hoverEndTimerRef.current);
      }
      if (hoverFadeTimerRef.current !== null) {
        clearTimeout(hoverFadeTimerRef.current);
      }
    };
  }, [markerGeometry, hitGeometry, markerMaterial, hitMaterial]);

  // Use a ref to track hovered index so useFrame always has the latest value
  const hoveredIndexRef = useRef<number | null>(null);
  const effectiveIndexRef = useRef<number | null>(null);
  useEffect(() => { hoveredIndexRef.current = hoveredIndex; }, [hoveredIndex]);
  useEffect(() => { effectiveIndexRef.current = hoveredIndex !== null ? hoveredIndex : showcaseIndex ?? null; }, [hoveredIndex, showcaseIndex]);

  // Track the post URL for the currently hovered marker
  const postUrlRef = useRef<string | null>(null);
  const handlePostLoaded = useCallback((url: string) => {
    postUrlRef.current = url;
  }, []);

  // Open post URL on Enter key when a tooltip is active
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't open post if user is typing in an input (e.g. search box)
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'Enter' && effectiveIndexRef.current !== null && postUrlRef.current) {
        window.open(postUrlRef.current, '_blank', 'noopener,noreferrer');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Track drag state to suppress click after dragging
  const isDraggingRef = useRef(false);
  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);
  const DRAG_THRESHOLD = 5; // pixels

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      pointerDownPosRef.current = { x: e.clientX, y: e.clientY };
      isDraggingRef.current = false;
    };
    const handlePointerMove = (e: PointerEvent) => {
      if (pointerDownPosRef.current && !isDraggingRef.current) {
        const dx = e.clientX - pointerDownPosRef.current.x;
        const dy = e.clientY - pointerDownPosRef.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
          isDraggingRef.current = true;
        }
      }
    };
    const handlePointerUp = () => {
      pointerDownPosRef.current = null;
    };
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  // Single useFrame for visibility + hover color + opacity
  useFrame(() => {
    const instanced = instancedRef.current;
    if (!instanced) return;

    // Sync marker material opacity with intro fade
    if (markerMaterial.opacity !== markerOpacity) {
      markerMaterial.opacity = markerOpacity;
      if (markerOpacity >= 1) {
        markerMaterial.transparent = false;
      }
    }

    const currentHovered = effectiveIndexRef.current;
    let colorChanged = false;

    for (let i = 0; i < positions.length; i++) {
      // Get world position of this instance
      instanced.getMatrixAt(i, tempMatrix);
      tempWorldPos.setFromMatrixPosition(tempMatrix);
      instanced.updateWorldMatrix(true, false);
      tempWorldPos.applyMatrix4(instanced.matrixWorld);

      // Visibility check
      tempDirection.copy(tempWorldPos).sub(camera.position).normalize();
      tempNormal.copy(tempWorldPos).normalize();
      const dot = tempDirection.dot(tempNormal);
      const visible = dot < 0;
      visibilityRef.current[i] = visible;

      // Scale to zero if not visible, normal if visible
      const scale = visible ? 1 : 0;
      tempMatrix.makeTranslation(positions[i].x, positions[i].y, positions[i].z);
      tempMatrix.scale(tempVec3.set(scale, scale, scale));
      instanced.setMatrixAt(i, tempMatrix);

      // Update color for hovered marker
      const isHovered = i === currentHovered && visible;
      instanced.setColorAt(i, isHovered ? MARKER_HOVER_COLOR : MARKER_COLOR);
      colorChanged = true;
    }

    instanced.instanceMatrix.needsUpdate = true;
    if (colorChanged && instanced.instanceColor) {
      instanced.instanceColor.needsUpdate = true;
    }

    // Also update hit mesh
    const hitMesh = hitMeshRef.current;
    if (hitMesh) {
      for (let i = 0; i < positions.length; i++) {
        const scale = visibilityRef.current[i] ? 1 : 0;
        tempMatrix.makeTranslation(positions[i].x, positions[i].y, positions[i].z);
        tempMatrix.scale(tempVec3.set(scale, scale, scale));
        hitMesh.setMatrixAt(i, tempMatrix);
      }
      hitMesh.instanceMatrix.needsUpdate = true;
    }

    // Track showcase marker visibility for tooltip fade-in
    if (showcaseIndex !== null && hoveredIndexRef.current === null) {
      const vis = visibilityRef.current[showcaseIndex] ?? false;
      if (vis && !showcaseMarkerVisibleRef.current) {
        // Marker just became visible — trigger fade-in on next frame
        showcaseMarkerVisibleRef.current = true;
        setShowcaseMarkerVisible(true);
        requestAnimationFrame(() => setShowcaseFadedIn(true));
      } else if (!vis && showcaseMarkerVisibleRef.current) {
        showcaseMarkerVisibleRef.current = false;
        setShowcaseMarkerVisible(false);
        setShowcaseFadedIn(false);
      }
    }
  });

  // Debounce hover-end to prevent flicker when auto-rotation shifts the marker under the cursor
  const hoverEndTimerRef = useRef<number | null>(null);

  // R3F pointer events provide instanceId directly on the event
  const handlePointerOver = useCallback((e: any) => {
    e.stopPropagation();
    // Block hover until markers are fully opaque
    if (markerOpacity < 1) return;
    // Cancel any pending hover-end
    if (hoverEndTimerRef.current !== null) {
      clearTimeout(hoverEndTimerRef.current);
      hoverEndTimerRef.current = null;
    }
    const idx = e.instanceId;
    if (idx !== undefined && visibilityRef.current[idx]) {
      // Cancel any pending fade-out
      if (hoverFadeTimerRef.current !== null) {
        clearTimeout(hoverFadeTimerRef.current);
        hoverFadeTimerRef.current = null;
      }
      setHoverFadingOut(false);
      setHoveredIndex(idx);
      onHoverChange?.(true);
      document.body.style.cursor = 'pointer';
    }
  }, [onHoverChange, markerOpacity]);

  // Hover fade-out state
  const [hoverFadingOut, setHoverFadingOut] = useState(false);
  const hoverFadeTimerRef = useRef<number | null>(null);

  const handlePointerOut = useCallback(() => {
    // Small debounce so rapid pointerOut→pointerOver from camera movement doesn't flicker
    if (hoverEndTimerRef.current !== null) {
      clearTimeout(hoverEndTimerRef.current);
    }
    hoverEndTimerRef.current = window.setTimeout(() => {
      hoverEndTimerRef.current = null;
      // Start fade-out instead of immediately removing
      setHoverFadingOut(true);
      onHoverChange?.(false);
      document.body.style.cursor = 'auto';
      // After fade-out completes, actually unmount
      if (hoverFadeTimerRef.current !== null) clearTimeout(hoverFadeTimerRef.current);
      hoverFadeTimerRef.current = window.setTimeout(() => {
        hoverFadeTimerRef.current = null;
        setHoveredIndex(null);
        setHoverFadingOut(false);
        postUrlRef.current = null;
      }, 60);
    }, 80);
  }, [onHoverChange]);

  const handleClick = useCallback((e: any) => {
    e.stopPropagation();
    // Suppress click if the user was dragging the globe
    if (isDraggingRef.current) return;
    // Use the tracked hovered index rather than the click event's instanceId,
    // because overlapping hit targets can cause the raycast to pick a different instance.
    const idx = hoveredIndexRef.current;
    if (idx !== null && visibilityRef.current[idx]) {
      const city = cities[idx];
      const url = postUrlRef.current || `https://www.reddit.com/r/${city.subreddit}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [cities]);

  // Effective hovered index: real hover takes priority, otherwise showcase
  const effectiveIndex = hoveredIndex !== null ? hoveredIndex : showcaseIndex;
  const isShowcaseTooltip = hoveredIndex === null && showcaseIndex !== null;

  // Track whether the showcase marker is on the visible (front) side of the globe
  const [showcaseMarkerVisible, setShowcaseMarkerVisible] = useState(false);
  const showcaseMarkerVisibleRef = useRef(false);

  // Fade-in state for showcase tooltips — only triggers once marker becomes visible
  const [showcaseFadedIn, setShowcaseFadedIn] = useState(false);
  useEffect(() => {
    if (showcaseIndex !== null && hoveredIndex === null) {
      setShowcaseFadedIn(false);
      showcaseMarkerVisibleRef.current = false;
      setShowcaseMarkerVisible(false);
    }
  }, [showcaseIndex, hoveredIndex]);

  // Hovered city position for tooltip
  const hoveredPosition = effectiveIndex !== null ? positions[effectiveIndex] : null;
  const hoveredCity = effectiveIndex !== null ? cities[effectiveIndex] : null;

  // Portrait mode: tooltip below marker, centered. Landscape: tooltip to the right.
  const [isPortrait, setIsPortrait] = useState(() => window.innerHeight > window.innerWidth);
  useEffect(() => {
    const handleResize = () => setIsPortrait(window.innerHeight > window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Tooltip opacity and transition duration
  // For showcase: hide when marker is on back side of globe, fade in when it rotates to front
  // For hover: quick 60ms fade-out on mouseout
  const tooltipOpacity = isShowcaseTooltip
    ? (showcaseFadingOut ? 0 : (showcaseMarkerVisible && showcaseFadedIn ? 1 : 0))
    : (hoverFadingOut ? 0 : 1);
  const tooltipTransition = isShowcaseTooltip
    ? (showcaseFadingOut ? 'opacity 600ms ease-in-out' : 'opacity 900ms ease-in-out')
    : (hoverFadingOut ? 'opacity 60ms ease-out' : 'opacity 400ms ease-in-out');

  return (
    <>
      {/* Visible markers - instanced */}
      <instancedMesh
        ref={instancedRef}
        args={[markerGeometry, markerMaterial, cities.length]}
        frustumCulled={false}
      />

      {/* Invisible hit targets - instanced */}
      <instancedMesh
        ref={hitMeshRef}
        args={[hitGeometry, hitMaterial, cities.length]}
        frustumCulled={false}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      />

      {/* Active marker overlay — renders on top of all other markers */}
      {hoveredCity && hoveredPosition && effectiveIndex !== null && visibilityRef.current[effectiveIndex] && (
        <mesh
          position={[hoveredPosition.x, hoveredPosition.y, hoveredPosition.z]}
          renderOrder={1}
          raycast={() => null}
        >
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshBasicMaterial color={MARKER_COLORS.hover} depthTest={false} />
        </mesh>
      )}

      {/* Single tooltip - only rendered for hovered marker */}
      {hoveredCity && hoveredPosition && (
        <group key={isShowcaseTooltip ? `showcase-${showcaseIndex}` : 'hover'} position={[hoveredPosition.x, hoveredPosition.y, hoveredPosition.z]}>
          <Html
            position={[0, 0, 0]}
            distanceFactor={5}
            style={{
              pointerEvents: 'none',
              transition: tooltipTransition,
              opacity: tooltipOpacity,
              ...(isPortrait
                ? { marginTop: '30px', transform: 'translateX(-50%)' }
                : { marginLeft: '15px' }),
            }}
          >
            <MarkerTooltip city={hoveredCity} hovered={true} onPostLoaded={handlePostLoaded} isPortrait={isPortrait} language={language} />
          </Html>
        </group>
      )}
    </>
  );
}
