import React, { useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { LiquidGlassPill } from './LiquidGlassPill';
import { HeroCTA } from './HeroCTA';
import { OmniaPreview } from './OmniaPreview';
import { HeroBackground } from './HeroBackground';

interface HeroSectionProps {
  onExplore: () => void;
  onLaunchOmnia?: () => void;
  /** Optional looping video URL to replace/augment the procedural abstract hero background */
  backgroundVideoSrc?: string;
  /** Optional WebM video URL for multi-format video delivery */
  backgroundVideoWebmSrc?: string;
  /** Optional poster image URL when using a background video asset */
  backgroundPosterSrc?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExplore,
  onLaunchOmnia,
  backgroundVideoSrc,
  backgroundVideoWebmSrc,
  backgroundPosterSrc,
}) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Parallax scroll effects matching exact prompt specifications
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  // Hero text group: y: [0, -200], opacity: [1, 0]
  const textY = useTransform(scrollYProgress, [0, 0.6], [0, -200]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.45], [1, 0]);

  // Omnia interface visual: y: [0, -250]
  const interfaceY = useTransform(scrollYProgress, [0, 1], [0, -250]);

  const handleStartCreating = () => {
    if (onLaunchOmnia) {
      onLaunchOmnia();
    } else {
      onExplore();
    }
  };

  const handleWatchDemo = () => {
    setIsDemoMode((prev) => {
      const next = !prev;
      if (next) {
        const previewEl = document.getElementById('omnia-preview');
        if (previewEl) {
          previewEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return next;
    });
  };

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative min-h-screen w-full overflow-hidden bg-[#050505] pt-28 md:pt-32 flex flex-col items-center justify-start selection:bg-[#eb3b2d] selection:text-white"
    >
      {/* Dynamic Looping Abstract Background (supports drop-in video replacement) */}
      <HeroBackground
        videoSrc={backgroundVideoSrc}
        videoWebmSrc={backgroundVideoWebmSrc}
        posterSrc={backgroundPosterSrc}
      />

      {/* Hero Content: Centered Column */}
      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        className="w-full max-w-4xl mx-auto text-center px-4 mt-8 md:mt-12 flex flex-col items-center z-10"
      >
        {/* Tag Pill with Entrance Animation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0, ease: [0.16, 1, 0.3, 1] }}
        >
          <LiquidGlassPill onClick={onExplore} />
        </motion.div>

        {/* Hero Title with Entrance Animation */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="typo-hero mb-5 max-w-3xl"
        >
          <span>An intelligent creative workspace.</span>
          <br />
          <span className="text-neutral-400 font-normal text-2xl sm:text-4xl md:text-[2.75rem] leading-tight">
            Powered by{' '}
            <span className="font-instrument-serif italic font-normal text-white">
              Omnia 1.0.
            </span>
          </span>
        </motion.h1>

        {/* Hero Subtitle with Entrance Animation */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="typo-body-lg mb-8 mx-auto"
        >
          Think, create, and build with one unified AI creative studio—moving seamlessly from raw intuition to production-ready work.
        </motion.p>

        {/* Liquid Glass Call-to-Action Component: 'Start Creating' + 'Watch Demo' */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mb-2 z-20"
        >
          <HeroCTA
            onStartCreating={handleStartCreating}
            onWatchDemo={handleWatchDemo}
            isDemoActive={isDemoMode}
          />
        </motion.div>
      </motion.div>

      {/* Hero Visual / AI Interface Area with Entrance Animation & Parallax */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full relative mt-6 md:mt-10 z-10"
      >
        <OmniaPreview
          yTransform={interfaceY}
          onOpenWorkspace={handleStartCreating}
          isDemoMode={isDemoMode}
          onStopDemo={() => setIsDemoMode(false)}
        />
      </motion.div>
    </section>
  );
};
