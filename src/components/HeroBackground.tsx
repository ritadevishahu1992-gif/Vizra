import React, { useEffect, useRef, useState } from 'react';

/**
 * Optional configuration for drop-in video replacement.
 * To replace or augment the procedural abstract background with a looping video asset,
 * set `defaultVideoSrc` (and optional `defaultVideoWebmSrc` / `defaultPosterSrc`) here
 * or pass `videoSrc` directly to `<HeroBackground videoSrc="..." />`.
 */
export const HERO_BACKGROUND_CONFIG = {
  defaultVideoSrc: '' as string,
  defaultVideoWebmSrc: '' as string,
  defaultPosterSrc: '' as string,
  /** Seamless loop cycle duration in seconds for the procedural light field */
  loopDurationSeconds: 28,
};

export interface HeroBackgroundProps {
  /** Optional MP4 video URL to replace/overlay the procedural background */
  videoSrc?: string;
  /** Optional WebM video URL for multi-format optimization */
  videoWebmSrc?: string;
  /** Optional poster image URL shown while the video loads */
  posterSrc?: string;
  /** Opacity of the video layer (0 to 1, default 0.55 to preserve dark obsidian mood) */
  videoOpacity?: number;
  /** Keep subtle red energy accents layered over the video when a video is active */
  keepEnergyOverlayWithVideo?: boolean;
  /** Additional className for the root container */
  className?: string;
}

interface LightOrb {
  xRatio: number;
  yRatio: number;
  radiusRatio: number;
  color: [number, number, number];
  baseAlpha: number;
  freqX: number;
  freqY: number;
  phaseOffset: number;
}

interface DustMote {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  phase: number;
  isCrimson: boolean;
}

// Curated abstract volumetric light sources: deep obsidian environment with extremely subtle warm-white & crimson energy
const VOLUMETRIC_ORBS: LightOrb[] = [
  // Primary faint crimson horizon energy core
  {
    xRatio: 0.5,
    yRatio: 0.36,
    radiusRatio: 0.46,
    color: [235, 59, 45], // #EB3B2D
    baseAlpha: 0.068,
    freqX: 1,
    freqY: 1,
    phaseOffset: 0,
  },
  // Secondary deep crimson lateral drift
  {
    xRatio: 0.28,
    yRatio: 0.52,
    radiusRatio: 0.38,
    color: [220, 38, 38], // #DC2626
    baseAlpha: 0.045,
    freqX: 1,
    freqY: 2,
    phaseOffset: 2.1,
  },
  // Subtle counter-balancing crimson ember on right flank
  {
    xRatio: 0.74,
    yRatio: 0.44,
    radiusRatio: 0.34,
    color: [185, 28, 28],
    baseAlpha: 0.04,
    freqX: 2,
    freqY: 1,
    phaseOffset: 4.2,
  },
  // Extremely faint champagne/white anamorphic top caustic
  {
    xRatio: 0.5,
    yRatio: 0.18,
    radiusRatio: 0.42,
    color: [245, 240, 235],
    baseAlpha: 0.028,
    freqX: 1,
    freqY: 1,
    phaseOffset: 1.05,
  },
  // Subtle lower studio ambient reflection
  {
    xRatio: 0.46,
    yRatio: 0.72,
    radiusRatio: 0.48,
    color: [255, 255, 255],
    baseAlpha: 0.018,
    freqX: 1,
    freqY: 1,
    phaseOffset: 3.14,
  },
];

export const HeroBackground: React.FC<HeroBackgroundProps> = ({
  videoSrc = HERO_BACKGROUND_CONFIG.defaultVideoSrc,
  videoWebmSrc = HERO_BACKGROUND_CONFIG.defaultVideoWebmSrc,
  posterSrc = HERO_BACKGROUND_CONFIG.defaultPosterSrc,
  videoOpacity = 0.55,
  keepEnergyOverlayWithVideo = true,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  const hasActiveVideo = Boolean((videoSrc || videoWebmSrc) && !videoFailed);
  const shouldRunProceduralCanvas = !hasActiveVideo || !videoReady || keepEnergyOverlayWithVideo;

  useEffect(() => {
    if (!shouldRunProceduralCanvas) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId = 0;
    let isVisibleInViewport = true;
    let isTabVisible = !document.hidden;

    // Respect user reduced-motion preference
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = motionQuery.matches;

    // Downscale internal canvas buffer (0.55x) for ultra-fast fill rate and natural optical softness
    const RENDER_SCALE = 0.55;
    let width = 0;
    let height = 0;

    // Initialize sparse optical light motes
    const motesCount = 22;
    const motes: DustMote[] = Array.from({ length: motesCount }, (_, idx) => ({
      x: ((idx * 37) % 100) / 100,
      y: ((idx * 61) % 100) / 100,
      size: 0.8 + (idx % 3) * 0.55,
      speedY: 0.008 + (idx % 4) * 0.003,
      speedX: (idx % 2 === 0 ? 1 : -1) * (0.004 + (idx % 3) * 0.002),
      phase: (idx / motesCount) * Math.PI * 2,
      isCrimson: idx % 3 === 0,
    }));

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      width = Math.max(320, Math.floor(rect.width * RENDER_SCALE));
      height = Math.max(240, Math.floor(rect.height * RENDER_SCALE));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });
    resizeObserver.observe(container);

    // Pause animation loop when Hero is scrolled off-screen
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          isVisibleInViewport = entry.isIntersecting;
        }
      },
      { threshold: 0.01 }
    );
    intersectionObserver.observe(container);

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleMotionPreferenceChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
    };
    motionQuery.addEventListener('change', handleMotionPreferenceChange);

    const loopDurationMs = HERO_BACKGROUND_CONFIG.loopDurationSeconds * 1000;
    const startTime = performance.now();

    const drawFrame = (now: number) => {
      animationFrameId = requestAnimationFrame(drawFrame);

      if ((!isVisibleInViewport || !isTabVisible) && now - startTime > 100) {
        return;
      }

      // Periodic angle [0, 2π) guarantees a mathematically seamless infinite loop
      const elapsed = prefersReducedMotion ? 4200 : (now - startTime) % loopDurationMs;
      const theta = (elapsed / loopDurationMs) * Math.PI * 2;

      ctx.clearRect(0, 0, width, height);

      const minDim = Math.min(width, height);
      const maxDim = Math.max(width, height);

      // 1. Volumetric light orbs with slow harmonic drift
      ctx.globalCompositeOperation = 'screen';

      for (let i = 0; i < VOLUMETRIC_ORBS.length; i++) {
        const orb = VOLUMETRIC_ORBS[i];
        const driftX = Math.sin(theta * orb.freqX + orb.phaseOffset) * (width * 0.09);
        const driftY = Math.cos(theta * orb.freqY + orb.phaseOffset) * (height * 0.06);

        const cx = width * orb.xRatio + driftX;
        const cy = height * orb.yRatio + driftY;
        const breathe = 1 + Math.sin(theta + orb.phaseOffset) * 0.12;
        const radius = maxDim * orb.radiusRatio * breathe;

        const alphaPulse =
          orb.baseAlpha * (0.85 + 0.15 * Math.sin(theta * 2 + orb.phaseOffset));

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        const [r, g, b] = orb.color;
        grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alphaPulse.toFixed(4)})`);
        grad.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, ${(alphaPulse * 0.42).toFixed(4)})`);
        grad.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Diagonal anamorphic light sweeps (subtle studio lens refraction)
      for (let beamIdx = 0; beamIdx < 2; beamIdx++) {
        const beamPhase = theta + beamIdx * Math.PI;
        const sweepOffset = Math.sin(beamPhase) * (width * 0.16);
        const centerX = width * (beamIdx === 0 ? 0.38 : 0.64) + sweepOffset;

        ctx.save();
        ctx.translate(centerX, height * 0.35);
        ctx.rotate((beamIdx === 0 ? -22 : 24) * (Math.PI / 180) + Math.cos(beamPhase) * 0.04);

        const beamWidth = minDim * 0.32;
        const beamHeight = maxDim * 1.3;
        const beamGrad = ctx.createLinearGradient(-beamWidth / 2, 0, beamWidth / 2, 0);

        const isCrimsonBeam = beamIdx === 0;
        const peakAlpha = isCrimsonBeam ? 0.032 : 0.018;
        const colorStr = isCrimsonBeam ? '235, 59, 45' : '255, 250, 245';

        beamGrad.addColorStop(0, `rgba(${colorStr}, 0)`);
        beamGrad.addColorStop(0.5, `rgba(${colorStr}, ${peakAlpha})`);
        beamGrad.addColorStop(1, `rgba(${colorStr}, 0)`);

        ctx.fillStyle = beamGrad;
        ctx.fillRect(-beamWidth / 2, -beamHeight / 2, beamWidth, beamHeight);
        ctx.restore();
      }

      // 3. Faint Red Energy Filaments (smooth continuous harmonic waves)
      const filamentConfigs = [
        {
          yBase: 0.34,
          amp1: 0.045,
          amp2: 0.022,
          color: '235, 59, 45',
          coreAlpha: 0.095,
          glowAlpha: 0.03,
          phaseShift: 0,
        },
        {
          yBase: 0.48,
          amp1: 0.035,
          amp2: 0.028,
          color: '220, 38, 38',
          coreAlpha: 0.06,
          glowAlpha: 0.022,
          phaseShift: 2.4,
        },
        {
          yBase: 0.27,
          amp1: 0.03,
          amp2: 0.016,
          color: '255, 255, 255',
          coreAlpha: 0.035,
          glowAlpha: 0.012,
          phaseShift: 4.1,
        },
      ];

      const stepX = Math.max(8, Math.floor(width / 48));

      for (let f = 0; f < filamentConfigs.length; f++) {
        const cfg = filamentConfigs[f];

        ctx.beginPath();
        for (let x = 0; x <= width + stepX; x += stepX) {
          const nx = x / width;
          // Edge attenuation so waves fade smoothly near left/right edges
          const envelope = Math.sin(Math.min(1, Math.max(0, nx)) * Math.PI);
          const yOffset =
            (Math.sin(nx * Math.PI * 2.5 + theta + cfg.phaseShift) * cfg.amp1 +
              Math.cos(nx * Math.PI * 1.5 - theta + cfg.phaseShift) * cfg.amp2) *
            height *
            envelope;

          const py = height * cfg.yBase + yOffset;
          if (x === 0) {
            ctx.moveTo(x, py);
          } else {
            ctx.lineTo(x, py);
          }
        }

        // Soft outer energy bloom pass
        ctx.strokeStyle = `rgba(${cfg.color}, ${cfg.glowAlpha})`;
        ctx.lineWidth = 6;
        ctx.stroke();

        // Crisp inner filament pass
        ctx.strokeStyle = `rgba(${cfg.color}, ${cfg.coreAlpha})`;
        ctx.lineWidth = 1.1;
        ctx.stroke();

        // Subtle traveling energy pulse along the primary crimson filament
        if (f === 0) {
          const pulseNormX = ((theta / (Math.PI * 2)) + 0.25) % 1;
          const pulseEnvelope = Math.sin(pulseNormX * Math.PI);
          const pulseX = pulseNormX * width;
          const pulseY =
            height * cfg.yBase +
            (Math.sin(pulseNormX * Math.PI * 2.5 + theta + cfg.phaseShift) * cfg.amp1 +
              Math.cos(pulseNormX * Math.PI * 1.5 - theta + cfg.phaseShift) * cfg.amp2) *
              height *
              pulseEnvelope;

          const pulseRadius = minDim * 0.09;
          const pulseGrad = ctx.createRadialGradient(
            pulseX,
            pulseY,
            0,
            pulseX,
            pulseY,
            pulseRadius
          );
          const pulseAlpha = 0.14 * pulseEnvelope;
          pulseGrad.addColorStop(0, `rgba(255, 120, 105, ${pulseAlpha.toFixed(4)})`);
          pulseGrad.addColorStop(0.35, `rgba(235, 59, 45, ${(pulseAlpha * 0.5).toFixed(4)})`);
          pulseGrad.addColorStop(1, 'rgba(235, 59, 45, 0)');

          ctx.fillStyle = pulseGrad;
          ctx.beginPath();
          ctx.arc(pulseX, pulseY, pulseRadius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 4. Sparse sub-pixel optical dust motes (seamless periodic trajectories)
      for (let m = 0; m < motes.length; m++) {
        const mote = motes[m];
        const mx =
          ((mote.x + Math.sin(theta + mote.phase) * mote.speedX * 4 + 1) % 1) * width;
        const my =
          ((mote.y - (theta / (Math.PI * 2)) * mote.speedY * 6 + 1) % 1) * height;

        const twinkle = 0.35 + 0.65 * Math.pow(Math.sin(theta * 2 + mote.phase), 2);
        const alpha = (mote.isCrimson ? 0.16 : 0.08) * twinkle;

        ctx.fillStyle = mote.isCrimson
          ? `rgba(235, 59, 45, ${alpha.toFixed(3)})`
          : `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(mx, my, mote.size, 0, Math.PI * 2);
        ctx.fill();
      }

      if (prefersReducedMotion) {
        cancelAnimationFrame(animationFrameId);
      }
    };

    animationFrameId = requestAnimationFrame(drawFrame);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      motionQuery.removeEventListener('change', handleMotionPreferenceChange);
    };
  }, [shouldRunProceduralCanvas]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      data-component="vizra-hero-background"
      className={`absolute inset-0 overflow-hidden bg-[#050505] pointer-events-none select-none z-0 ${className}`}
    >
      {/* Layer 1: Optional Drop-In Looping Video Asset */}
      {hasActiveVideo && (
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster={posterSrc || undefined}
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoFailed(true)}
          style={{ opacity: videoReady ? videoOpacity : 0 }}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-out"
        >
          {videoWebmSrc && <source src={videoWebmSrc} type="video/webm" />}
          {videoSrc && <source src={videoSrc} type="video/mp4" />}
        </video>
      )}

      {/* Layer 2: Hardware-Accelerated Abstract Light & Crimson Energy Canvas */}
      {shouldRunProceduralCanvas && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover opacity-95"
        />
      )}

      {/* Layer 3: Subtle Architectural Optical Grid (fades out toward edges via radial mask) */}
      <div
        className="absolute inset-0 opacity-[0.022]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.9) 1px, transparent 1px)',
          backgroundSize: '4.5rem 4.5rem',
          maskImage: 'radial-gradient(ellipse 75% 55% at 50% 34%, #000 15%, transparent 80%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 75% 55% at 50% 34%, #000 15%, transparent 80%)',
        }}
      />

      {/* Layer 4: Ultra-Fine Top Anamorphic Horizon Accent Line */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[78%] max-w-5xl h-px opacity-35"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 25%, rgba(235,59,45,0.55) 50%, rgba(255,255,255,0.12) 75%, transparent 100%)',
        }}
      />

      {/* Layer 5: Measured Atmospheric Vignette & Contrast Scrims for WCAG Legibility */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 85% 65% at 50% 36%, transparent 25%, rgba(5, 5, 5, 0.72) 75%, #050505 100%)',
        }}
      />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#050505] via-[#050505]/50 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#090909] via-[#090909]/80 to-transparent" />
    </div>
  );
};
