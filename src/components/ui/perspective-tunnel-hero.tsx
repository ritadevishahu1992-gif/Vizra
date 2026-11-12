import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useReducedMotion,
  AnimatePresence,
} from 'motion/react';
import {
  Sparkles,
  ArrowUpRight,
  ChevronDown,
  Layers,
  Eye,
  Compass,
  SlidersHorizontal,
  Maximize2,
  X,
} from 'lucide-react';
import { VizraLogo } from '../VizraLogo';

export interface TunnelShowcaseItem {
  id: string;
  title: string;
  category: string;
  model: string;
  aspectRatio: string;
  src: string;
  alt: string;
  prompt: string;
  /**
   * 3D tunnel coordinates:
   * x: horizontal offset (%) from center (-42 to +42)
   * y: vertical offset (%) from center (-34 to +34)
   * z: initial depth in px (-1650 to -120)
   * rotateZ: subtle editorial tilt in degrees
   */
  position: {
    x: number;
    y: number;
    z: number;
    rotateZ?: number;
  };
}

export interface PerspectiveTunnelHeroProps {
  id?: string;
  eyebrow?: string;
  heading?: string;
  supportingText?: string;
  scrollInstruction?: string;
  items?: TunnelShowcaseItem[];
  onSelectCard?: (item: TunnelShowcaseItem) => void;
  className?: string;
}

export const DEFAULT_TUNNEL_CARDS: TunnelShowcaseItem[] = [
  {
    id: 'tunnel-card-01',
    title: 'Obsidian Monolith Sanctuary',
    category: 'Architectural Concept',
    model: 'Omnia Vision 2.5',
    aspectRatio: '4:5',
    src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80',
    alt: 'Brutalist dark architectural monolith illuminated by warm crimson horizon light',
    prompt:
      'Generate a brutalist obsidian architectural sanctuary cantilevered over a volcanic black sand coast at dusk, warm crimson rim lighting, 35mm architectural photography.',
    position: { x: -30, y: -20, z: -180, rotateZ: -3 },
  },
  {
    id: 'tunnel-card-02',
    title: 'Crimson Kinetic Sculpture',
    category: '3D Spatial Render',
    model: 'Omnia Shader Lab',
    aspectRatio: '1:1',
    src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=900&q=80',
    alt: 'Abstract liquid metal and crimson glass 3D sculpture suspended in dark studio space',
    prompt:
      'Create a 3D procedural sculpture combining brushed dark titanium and translucent crimson glass ribbons suspended in zero gravity, studio chiaroscuro lighting.',
    position: { x: 31, y: -16, z: -340, rotateZ: 3.5 },
  },
  {
    id: 'tunnel-card-03',
    title: 'Noir Cybernetic Portrait',
    category: 'Editorial Portrait',
    model: 'Omnia Vision 2.5',
    aspectRatio: '3:4',
    src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80',
    alt: 'High-contrast editorial portrait with dramatic studio rim lighting and deep shadows',
    prompt:
      'High-fashion editorial close-up portrait in dramatic low-key studio lighting, subtle crimson optical reflections on matte carbon visor, medium format film grain.',
    position: { x: -34, y: 21, z: -520, rotateZ: 2 },
  },
  {
    id: 'tunnel-card-04',
    title: 'Acoustic Chrono-Instrument',
    category: 'Industrial Design',
    model: 'Omnia Product Studio',
    aspectRatio: '16:10',
    src: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=900&q=80',
    alt: 'Precision anodized aluminum audio synthesizer with glowing crimson telemetry dials',
    prompt:
      'Industrial product design render of a modular analog synthesizer milled from matte black anodized aluminum with ruby-red LED telemetry meters, macro studio shot.',
    position: { x: 29, y: 22, z: -700, rotateZ: -2.5 },
  },
  {
    id: 'tunnel-card-05',
    title: 'Volcanic Horizon Telemetry',
    category: 'Atmospheric Landscape',
    model: 'Omnia Vision 2.5',
    aspectRatio: '16:9',
    src: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=900&q=80',
    alt: 'Aerial view of dark basalt mountain ridges with glowing volcanic fissures at twilight',
    prompt:
      'Cinematic aerial shot of Icelandic black basalt mountain ridges with subtle glowing magma fissures under a moody overcast twilight sky, anamorphic lens.',
    position: { x: 0, y: -27, z: -880, rotateZ: 0 },
  },
  {
    id: 'tunnel-card-06',
    title: 'Neural Lattice Typography',
    category: 'Typography & Motion',
    model: 'Omnia Vector Engine',
    aspectRatio: '4:5',
    src: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=900&q=80',
    alt: 'Minimalist geometric light patterns and architectural shadows in high contrast',
    prompt:
      'Design a Swiss brutalist typographic poster for VIZRA OMNIA featuring razor-sharp geometric grids, optical depth lines, and restrained crimson accents on #090909 paper.',
    position: { x: -27, y: -6, z: -1060, rotateZ: -4 },
  },
  {
    id: 'tunnel-card-07',
    title: 'Orbital Docking Frame 09',
    category: 'Cinematic Keyframe',
    model: 'Omnia Storyboard',
    aspectRatio: '21:9',
    src: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=900&q=80',
    alt: 'Deep space orbital station silhouette against planetary atmospheric curvature',
    prompt:
      'Keyframe concept art for a hard sci-fi film: matte carbon orbital research ring crossing the terminator line of an exoplanet with crimson atmospheric scattering.',
    position: { x: 28, y: -4, z: -1240, rotateZ: 3 },
  },
  {
    id: 'tunnel-card-08',
    title: 'Bioluminescent Carbon Flora',
    category: 'Macro Synthesis',
    model: 'Omnia Vision 2.5',
    aspectRatio: '1:1',
    src: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=80',
    alt: 'Macro botanical structure with dark crystalline petals and warm ember illumination',
    prompt:
      'Extreme macro photography of a synthetic carbon-fiber botanical flower with translucent ruby filaments glowing softly in a dark laboratory terrarium.',
    position: { x: -22, y: 24, z: -1420, rotateZ: 2.5 },
  },
  {
    id: 'tunnel-card-09',
    title: 'Omnia Core Raymarch Study',
    category: 'Generative Shader',
    model: 'Omnia GLSL 1.0',
    aspectRatio: '16:10',
    src: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=900&q=80',
    alt: 'Fine art oil and digital pigment study with rich crimson and charcoal textures',
    prompt:
      'Write a real-time WebGL raymarched signed-distance-field shader depicting a folding 4D hypercube in obsidian space with physically based crimson caustics.',
    position: { x: 22, y: 23, z: -1580, rotateZ: -2 },
  },
];

const TUNNEL_DEPTH_RINGS = [0, 1, 2, 3, 4, 5, 6];
const MAX_TUNNEL_TRAVEL = 1620;

interface TunnelCardViewProps {
  item: TunnelShowcaseItem;
  index: number;
  currentTravelZ: number;
  isMobile: boolean;
  onInspect: (item: TunnelShowcaseItem) => void;
}

const TunnelCardView: React.FC<TunnelCardViewProps> = ({
  item,
  index,
  currentTravelZ,
  isMobile,
  onInspect,
}) => {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Calculate effective Z position as the user scrolls through the tunnel
  const rawZ = item.position.z + currentTravelZ;
  // Wrap smoothly so the tunnel never feels empty at either extreme
  const wrappedZ =
    rawZ > 260 ? rawZ - (MAX_TUNNEL_TRAVEL + 240) : rawZ;

  // Opacity fades in from deep distance (-1650px -> -1100px) and fades out as it passes the camera (80px -> 250px)
  let opacity = 1;
  if (wrappedZ < -1250) {
    opacity = Math.max(0.08, (wrappedZ + 1700) / 450);
  } else if (wrappedZ > 60) {
    opacity = Math.max(0, 1 - (wrappedZ - 60) / 190);
  }

  // Scale down horizontal/vertical spread slightly on compact mobile screens so cards stay framed
  const spreadFactor = isMobile ? 0.68 : 1;
  const xOffset = item.position.x * spreadFactor;
  const yOffset = item.position.y * spreadFactor;
  const tilt = item.position.rotateZ ?? 0;

  return (
    <div
      style={{
        transform: `translate3d(-50%, -50%, ${wrappedZ.toFixed(1)}px) rotateZ(${tilt}deg)`,
        left: `${50 + xOffset}%`,
        top: `${50 + yOffset}%`,
        opacity: Number(opacity.toFixed(3)),
        zIndex: Math.round(2000 + wrappedZ),
        pointerEvents: opacity > 0.25 && wrappedZ > -1150 && wrappedZ < 160 ? 'auto' : 'none',
      }}
      className="absolute w-44 sm:w-56 md:w-64 lg:w-72 transition-shadow duration-300 will-change-transform"
    >
      <button
        type="button"
        onClick={() => onInspect(item)}
        aria-label={`Inspect ${item.title} (${item.category})`}
        className="group relative w-full text-left rounded-2xl overflow-hidden bg-[#111111]/95 border border-white/10 hover:border-[#DC2626]/70 shadow-[0_24px_60px_rgba(0,0,0,0.85)] hover:shadow-[0_24px_70px_rgba(220,38,38,0.22)] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] cursor-pointer"
      >
        {/* Image Frame */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#171717]">
          {/* Loading Shimmer */}
          {!imgLoaded && !imgError && (
            <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#222222] to-[#141414] animate-pulse flex items-center justify-center">
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                 frame 0{index + 1}
              </span>
            </div>
          )}

          {/* Fallback State if External Image Fails */}
          {imgError ? (
            <div className="absolute inset-0 bg-[#111111] flex flex-col items-center justify-center p-4 text-center border-b border-white/5">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 border border-[#DC2626]/30"
                style={{
                  background:
                    'radial-gradient(circle at center, rgba(220,38,38,0.22) 0%, rgba(17,17,17,0.9) 100%)',
                }}
              >
                <Sparkles size={18} className="text-[#EB3B2D]" />
              </div>
              <span className="text-xs font-medium text-white line-clamp-1">{item.title}</span>
              <span className="text-[10px] font-mono text-neutral-400 mt-0.5">
                {item.category}
              </span>
            </div>
          ) : (
            <img
              src={item.src}
              alt={item.alt}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
              className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}

          {/* Subtle Obsidian & Crimson Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#090909] via-[#090909]/25 to-transparent opacity-85 group-hover:opacity-70 transition-opacity" />

          {/* Top Index & Aspect Tag */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
            <span className="px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md border border-white/10 text-[10px] font-mono uppercase tracking-wider text-neutral-300">
              0{index + 1} · {item.category}
            </span>
            <span className="w-6 h-6 rounded-md bg-black/75 backdrop-blur-md border border-white/10 flex items-center justify-center text-neutral-300 group-hover:text-white group-hover:border-[#DC2626]/60 group-hover:bg-[#DC2626]/20 transition-colors">
              <Maximize2 size={11} />
            </span>
          </div>

          {/* Bottom Caption Bar inside Card */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-end justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-medium text-white truncate group-hover:text-white">
                {item.title}
              </p>
              <p className="text-[10px] font-mono text-neutral-400 truncate flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] shrink-0" />
                <span>{item.model}</span>
              </p>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
};

export const PerspectiveTunnelHero: React.FC<PerspectiveTunnelHeroProps> = ({
  id = 'creative-showcase',
  eyebrow = 'VIZRA CREATIVE SHOWCASE',
  heading = 'ENTER THE CREATIVE UNIVERSE.',
  supportingText = 'Explore a universe of ideas, visuals and creative possibilities, brought to life with AI.',
  scrollInstruction = 'SCROLL TO EXPLORE',
  items = DEFAULT_TUNNEL_CARDS,
  onSelectCard,
  className = '',
}) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const [scrollRatio, setScrollRatio] = useState(0);
  const [manualOverride, setManualOverride] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'tunnel' | 'grid'>('tunnel');
  const [isMobile, setIsMobile] = useState(false);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [activeCard, setActiveCard] = useState<TunnelShowcaseItem | null>(null);

  // Framer Motion scroll progress linked to the section container
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 24,
    restDelta: 0.001,
  });

  // Transform scroll progress into curtains/copy scale & subtle depth cues
  const centerCopyScale = useTransform(smoothProgress, [0, 0.45, 0.9], [1, 1.05, 0.96]);
  const centerCopyOpacity = useTransform(smoothProgress, [0, 0.72, 0.95], [1, 0.92, 0.78]);

  // Detect mobile viewport for responsive card spacing
  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport, { passive: true });
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Native page-friendly scroll listener (NEVER calls preventDefault)
  useEffect(() => {
    const updateScrollFromWindow = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const scrollableDistance = Math.max(1, rect.height - viewportHeight);

      // Compute progress [0..1] while the user scrolls through the section
      const rawProgress = -rect.top / scrollableDistance;
      const clamped = Math.max(0, Math.min(1, rawProgress));
      setScrollRatio(clamped);
    };

    updateScrollFromWindow();
    window.addEventListener('scroll', updateScrollFromWindow, { passive: true });
    window.addEventListener('resize', updateScrollFromWindow, { passive: true });
    return () => {
      window.removeEventListener('scroll', updateScrollFromWindow);
      window.removeEventListener('resize', updateScrollFromWindow);
    };
  }, []);

  // Clear manual override when user actively scrolls the page
  useEffect(() => {
    if (manualOverride !== null && scrollRatio > 0.05 && scrollRatio < 0.95) {
      setManualOverride(null);
    }
  }, [scrollRatio, manualOverride]);

  const handlePointerMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (prefersReducedMotion || isMobile) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const normY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      setPointer({
        x: Math.max(-1, Math.min(1, normX)),
        y: Math.max(-1, Math.min(1, normY)),
      });
    },
    [prefersReducedMotion, isMobile]
  );

  const handlePointerLeave = useCallback(() => {
    setPointer({ x: 0, y: 0 });
  }, []);

  const effectiveProgress = manualOverride !== null ? manualOverride : scrollRatio;
  const currentTravelZ = prefersReducedMotion ? 220 : effectiveProgress * MAX_TUNNEL_TRAVEL;
  const showAccessibleGrid = Boolean(prefersReducedMotion) || viewMode === 'grid';

  const depthPresets = [
    { label: '01 Surface', value: 0.08 },
    { label: '02 Mid-Tunnel', value: 0.48 },
    { label: '03 Deep Core', value: 0.88 },
  ];

  return (
    <section
      id={id}
      ref={sectionRef}
      aria-label="VIZRA Creative Universe 3D Perspective Showcase"
      className={`relative w-full bg-[#090909] text-white border-t border-b border-white/[0.08] select-none ${
        showAccessibleGrid ? 'py-20 md:py-28' : 'min-h-[210vh] md:min-h-[245vh]'
      } ${className}`}
    >
      {/* Sticky Full-Viewport 3D Perspective Stage (No Wheel Trap) */}
      <div
        onMouseMove={handlePointerMove}
        onMouseLeave={handlePointerLeave}
        className={
          showAccessibleGrid
            ? 'relative w-full max-w-7xl mx-auto px-6 md:px-12'
            : 'sticky top-14 md:top-16 h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)] w-full overflow-hidden flex flex-col justify-between'
        }
      >
        {/* Ambient VIZRA Charcoal & Restrained Crimson Glow */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] sm:w-[780px] h-[560px] sm:h-[780px] rounded-full blur-[150px] opacity-30"
            style={{
              background:
                'radial-gradient(circle at center, rgba(220,38,38,0.28) 0%, rgba(235,59,45,0.08) 45%, rgba(9,9,9,0) 75%)',
            }}
          />
          {/* Subtle Architectural Crosshair Grid */}
          <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4.5rem_4.5rem]" />
          {/* Converging Perspective Tunnel Guide Lines */}
          {!showAccessibleGrid && (
            <svg
              className="absolute inset-0 w-full h-full opacity-[0.14]"
              viewBox="0 0 1440 900"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <line x1="0" y1="0" x2="720" y2="450" stroke="#ffffff" strokeWidth="0.75" />
              <line x1="1440" y1="0" x2="720" y2="450" stroke="#ffffff" strokeWidth="0.75" />
              <line x1="0" y1="900" x2="720" y2="450" stroke="#ffffff" strokeWidth="0.75" />
              <line x1="1440" y1="900" x2="720" y2="450" stroke="#ffffff" strokeWidth="0.75" />
              <line x1="720" y1="0" x2="720" y2="900" stroke="#DC2626" strokeWidth="0.6" strokeDasharray="4 8" />
              <line x1="0" y1="450" x2="1440" y2="450" stroke="#DC2626" strokeWidth="0.6" strokeDasharray="4 8" />
            </svg>
          )}
        </div>

        {/* Top Bar inside Showcase: Brand Identity + Interactive Depth / View Controls */}
        <div className="relative z-30 w-full max-w-7xl mx-auto px-6 md:px-12 pt-5 md:pt-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#141414] border border-white/10 flex items-center justify-center shadow-inner">
              <VizraLogo size={16} />
            </div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider">
              <span className="text-white font-semibold">VIZRA</span>
              <span className="text-neutral-600">/</span>
              <span className="text-[#EB3B2D]">{eyebrow}</span>
            </div>
          </div>

          {/* Interactive Depth Presets & Grid Toggle (Accessible on Mobile & Keyboard) */}
          <div className="flex items-center gap-2 flex-wrap">
            {!showAccessibleGrid && (
              <div
                role="group"
                aria-label="Tunnel depth navigation"
                className="hidden sm:flex items-center gap-1 p-1 rounded-lg bg-[#121212]/90 backdrop-blur-md border border-white/10"
              >
                {depthPresets.map((preset) => {
                  const isActive = Math.abs(effectiveProgress - preset.value) < 0.2;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setManualOverride(preset.value)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#DC2626] text-white font-medium'
                          : 'text-neutral-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={() => setViewMode((prev) => (prev === 'tunnel' ? 'grid' : 'tunnel'))}
              className="px-3 py-1.5 rounded-lg bg-[#121212]/90 backdrop-blur-md border border-white/10 hover:border-white/25 text-xs font-mono text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Toggle between 3D Perspective Tunnel and Grid Matrix view"
            >
              <Layers size={13} className="text-[#EB3B2D]" />
              <span>{showAccessibleGrid ? '3D Tunnel View' : 'Inspect All (9)'}</span>
            </button>
          </div>
        </div>

        {/* 3D PERSPECTIVE TUNNEL STAGE */}
        {!showAccessibleGrid ? (
          <div
            className="relative flex-1 w-full flex items-center justify-center overflow-hidden"
            style={{
              perspective: '1150px',
              perspectiveOrigin: '50% 50%',
            }}
          >
            {/* 3D World Container with subtle pointer parallax */}
            <div
              className="relative w-full h-full flex items-center justify-center transition-transform duration-200 ease-out"
              style={{
                transformStyle: 'preserve-3d',
                transform: `rotateX(${(-pointer.y * 4.5).toFixed(2)}deg) rotateY(${(
                  pointer.x * 6
                ).toFixed(2)}deg)`,
              }}
            >
              {/* Concentric 3D Tunnel Depth Frames */}
              {TUNNEL_DEPTH_RINGS.map((ringIndex) => {
                const baseRingZ = -ringIndex * 260;
                const ringZ = ((baseRingZ + currentTravelZ) % 1820) - 1560;
                const ringOpacity = Math.max(
                  0.03,
                  Math.min(0.22, (ringZ + 1650) / 1400)
                );
                const isCrimsonRing = ringIndex % 3 === 0;

                return (
                  <div
                    key={`tunnel-ring-${ringIndex}`}
                    aria-hidden="true"
                    style={{
                      transform: `translate3d(-50%, -50%, ${ringZ.toFixed(1)}px)`,
                      opacity: Number(ringOpacity.toFixed(3)),
                    }}
                    className={`pointer-events-none absolute left-1/2 top-1/2 w-[84vw] max-w-[1120px] h-[68vh] max-h-[680px] rounded-3xl border ${
                      isCrimsonRing ? 'border-[#DC2626]/40' : 'border-white/15'
                    }`}
                  />
                );
              })}

              {/* 9 Floating Showcase Artwork Cards in 3D Z-Space */}
              {items.map((item, index) => (
                <TunnelCardView
                  key={item.id}
                  item={item}
                  index={index}
                  currentTravelZ={currentTravelZ}
                  isMobile={isMobile}
                  onInspect={(selected) => setActiveCard(selected)}
                />
              ))}
            </div>

            {/* Center Focal Editorial Copy Overlay */}
            <motion.div
              style={{
                scale: centerCopyScale,
                opacity: centerCopyOpacity,
              }}
              className="relative z-20 pointer-events-none max-w-3xl mx-auto px-6 text-center flex flex-col items-center"
            >
              {/* Eyebrow Badge */}
              <div className="pointer-events-auto inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111111]/90 backdrop-blur-xl border border-white/10 text-[11px] font-mono uppercase tracking-[0.18em] text-neutral-300 mb-5 shadow-2xl">
                <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626] animate-pulse" />
                <span>{eyebrow}</span>
              </div>

              {/* Main Display Heading */}
              <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-[-0.03em] leading-[1.02] text-white drop-shadow-[0_12px_36px_rgba(0,0,0,0.95)] mb-4">
                {heading}
              </h2>

              {/* Supporting Copy */}
              <p className="text-sm sm:text-base md:text-lg text-neutral-300 max-w-xl mx-auto font-normal leading-relaxed drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] mb-6">
                {supportingText}
              </p>

              {/* Interactive Action Pill */}
              {onSelectCard && items[0] && (
                <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveCard(items[0])}
                    className="px-5 py-2.5 rounded-full bg-white text-black hover:bg-neutral-200 text-xs sm:text-sm font-semibold tracking-tight flex items-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.18)] transition-all cursor-pointer"
                  >
                    <Eye size={14} className="text-[#DC2626]" />
                    <span>Explore Showcase Works</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectCard(items[0])}
                    className="px-4 py-2.5 rounded-full bg-[#141414]/90 hover:bg-[#1c1c1c] text-neutral-200 hover:text-white border border-white/15 hover:border-[#DC2626]/60 text-xs sm:text-sm font-medium flex items-center gap-1.5 backdrop-blur-xl transition-all cursor-pointer"
                  >
                    <Sparkles size={13} className="text-[#EB3B2D]" />
                    <span>Synthesize in Omnia</span>
                    <ArrowUpRight size={13} />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        ) : (
          /* ACCESSIBLE / REDUCED-MOTION / INSPECT-ALL MATRIX VIEW */
          <div className="relative z-20 py-10">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111111] border border-white/10 text-[11px] font-mono uppercase tracking-[0.18em] text-neutral-300 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />
                <span>{eyebrow}</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white mb-4">
                {heading}
              </h2>
              <p className="text-base text-neutral-300 max-w-xl mx-auto leading-relaxed">
                {supportingText}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="group rounded-2xl overflow-hidden bg-[#111111] border border-white/10 hover:border-[#DC2626]/60 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-[16/10] bg-[#171717] overflow-hidden">
                      <img
                        src={item.src}
                        alt={item.alt}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-mono uppercase text-neutral-300">
                        0{idx + 1} · {item.category}
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <h3 className="text-base font-semibold text-white">{item.title}</h3>
                        <span className="text-[11px] font-mono text-[#EB3B2D]">{item.model}</span>
                      </div>
                      <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                        {item.prompt}
                      </p>
                    </div>
                  </div>
                  <div className="px-5 pb-5 pt-2 flex items-center justify-between gap-2 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => setActiveCard(item)}
                      className="text-xs font-mono text-neutral-300 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <Eye size={12} className="text-[#EB3B2D]" />
                      <span>Inspect Specs</span>
                    </button>
                    {onSelectCard && (
                      <button
                        type="button"
                        onClick={() => onSelectCard(item)}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-[#DC2626] text-white text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Open in Omnia</span>
                        <ArrowUpRight size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Telemetry & Scroll Instruction Bar */}
        {!showAccessibleGrid && (
          <div className="relative z-30 w-full max-w-7xl mx-auto px-6 md:px-12 pb-5 md:pb-7 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Scroll Instruction */}
            <div className="flex items-center gap-2.5 text-[11px] font-mono uppercase tracking-[0.2em] text-neutral-400">
              <span className="w-6 h-6 rounded-full bg-[#141414] border border-white/10 flex items-center justify-center text-[#EB3B2D]">
                <ChevronDown size={13} className="animate-bounce" />
              </span>
              <span>{scrollInstruction}</span>
            </div>

            {/* Interactive Depth Scrubber for Touch / Mouse / Keyboard */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
              <Compass size={13} className="text-[#EB3B2D] shrink-0" />
              <label htmlFor="vizra-tunnel-depth-slider" className="sr-only">
                Tunnel Z-Depth Progress
              </label>
              <input
                id="vizra-tunnel-depth-slider"
                type="range"
                min={0}
                max={100}
                value={Math.round(effectiveProgress * 100)}
                onChange={(e) => setManualOverride(Number(e.target.value) / 100)}
                className="w-36 sm:w-44 accent-[#DC2626] h-1 bg-neutral-800 rounded-lg cursor-pointer"
              />
              <span className="text-[11px] font-mono text-neutral-400 w-20 text-right">
                Z: {Math.round(effectiveProgress * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Artwork Detail & Prompt Launch Modal */}
      <AnimatePresence>
        {activeCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveCard(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="tunnel-modal-title"
              className="relative w-full max-w-2xl rounded-2xl bg-[#111111] border border-white/15 shadow-[0_25px_80px_rgba(0,0,0,0.95)] overflow-hidden"
            >
              <div className="relative aspect-[16/9] bg-[#171717]">
                <img
                  src={activeCard.src}
                  alt={activeCard.alt}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-black/40" />
                <button
                  type="button"
                  onClick={() => setActiveCard(null)}
                  aria-label="Close showcase preview"
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/75 border border-white/15 text-neutral-300 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X size={15} />
                </button>
                <div className="absolute bottom-4 left-6 right-6 flex flex-wrap items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-black/80 border border-white/10 text-xs font-mono uppercase text-[#EB3B2D]">
                    {activeCard.category}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-black/80 border border-white/10 text-xs font-mono text-neutral-300">
                    {activeCard.model} · Aspect {activeCard.aspectRatio}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h3 id="tunnel-modal-title" className="text-xl font-semibold text-white mb-2">
                  {activeCard.title}
                </h3>
                <div className="p-3.5 rounded-xl bg-[#090909] border border-white/10 mb-5">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
                    <SlidersHorizontal size={11} className="text-[#EB3B2D]" />
                    <span>Omnia Synthesis Prompt</span>
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-mono">
                    "{activeCard.prompt}"
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveCard(null)}
                    className="px-4 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-300 cursor-pointer"
                  >
                    Close
                  </button>
                  {onSelectCard && (
                    <button
                      type="button"
                      onClick={() => {
                        const chosen = activeCard;
                        setActiveCard(null);
                        onSelectCard(chosen);
                      }}
                      className="px-5 py-2 rounded-lg bg-[#DC2626] hover:bg-[#EB3B2D] text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-lg shadow-[#DC2626]/25 transition-colors cursor-pointer"
                    >
                      <Sparkles size={14} />
                      <span>Remix Prompt in Omnia</span>
                      <ArrowUpRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default PerspectiveTunnelHero;
