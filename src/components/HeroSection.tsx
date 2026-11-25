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
      className="relative min-h-screen w-full overflow-hidden bg-[#050505] pt-24 sm:pt-28 md:pt-32 flex flex-col items-center justify-start selection:bg-[#eb3b2d] selection:text-white"
    >
      {/* Dynamic Looping Abstract Background (supports drop-in video replacement) */}
      <HeroBackground
        videoSrc={backgroundVideoSrc}
        videoWebmSrc={backgroundVideoWebmSrc}
        posterSrc={backgroundPosterSrc}
      />

      {/* Hero Content: Centered Editorial Column */}
      <motion.div
        style={{ y: textY, opacity: textOpacity }}
        className="w-full max-w-4xl mx-auto text-center px-5 sm:px-6 mt-6 sm:mt-8 md:mt-10 flex flex-col items-center z-10"
      >
        {/* Restrained Brand Kicker */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0, ease: [0.16, 1, 0.3, 1] }}
        >
          <LiquidGlassPill onClick={onExplore} />
        </motion.div>

        {/* Primary Display Headline with Harmonized Omnia 1.0 Complement */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="font-display font-semibold tracking-[-0.03em] text-white text-[2.15rem] sm:text-5xl md:text-[3.75rem] leading-[1.08] max-w-3xl text-balance mb-5"
        >
          <span>An intelligent creative workspace.</span>
          <span className="mt-2 sm:mt-2.5 block font-normal text-neutral-400 text-[1.5rem] sm:text-[2.15rem] md:text-[2.65rem] leading-[1.15] tracking-[-0.02em]">
            Powered by{' '}
            <span className="font-instrument-serif italic font-normal text-white tracking-normal text-[1.12em]">
              Omnia 1.0
            </span>
          </span>
        </motion.h1>

        {/* Hero Subtitle: Tightened Optical Measure for Desktop & Mobile Readability */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="text-[15px] sm:text-base md:text-[17px] leading-[1.65] text-neutral-400 max-w-xl mx-auto mb-8"
        >
          Think, create, and build inside one unified AI studio—moving seamlessly from raw intuition to production-ready work.
        </motion.p>

        {/* Hero CTA Group: Primary 'Start Creating' + Secondary 'Watch Demo' */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="w-full sm:w-auto mb-2 z-20"
        >
          <HeroCTA
            onStartCreating={handleStartCreating}
            onWatchDemo={handleWatchDemo}
            isDemoActive={isDemoMode}
          />
        </motion.div>
      </motion.div>

      {/* Hero Visual / Interactive Omnia Studio Preview */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="w-full relative mt-6 sm:mt-8 md:mt-10 z-10"
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
