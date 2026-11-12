import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';
import { LiquidGlassPill } from './LiquidGlassPill';
import { PrimaryCTA } from './PrimaryCTA';
import { OmniaPreview } from './OmniaPreview';

interface HeroSectionProps {
  onExplore: () => void;
  onLaunchOmnia?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onExplore, onLaunchOmnia }) => {
  const sectionRef = useRef<HTMLElement | null>(null);

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

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative min-h-screen w-full overflow-hidden bg-black pt-28 md:pt-32 flex flex-col items-center justify-start selection:bg-[#eb3b2d] selection:text-white"
    >
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

        {/* Both CTAs with Entrance Animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-2 z-20"
        >
          {/* Primary CTA: Try Omnia -> /ai */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={onLaunchOmnia}
            className="group relative inline-flex items-center justify-center gap-2.5 bg-white text-black rounded-full px-8 py-3.5 text-base font-semibold shadow-xl hover:bg-neutral-100 transition-colors cursor-pointer select-none"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#eb3b2d]" />
            <span>Try Omnia</span>
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-black/10 group-hover:bg-[#eb3b2d] group-hover:text-white transition-colors duration-200">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </span>
          </motion.button>

          {/* Secondary CTA: Explore Vizra -> /explore */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onExplore}
            className="inline-flex items-center justify-center gap-2 bg-neutral-900/90 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 rounded-full px-7 py-3.5 text-base font-medium transition-colors cursor-pointer select-none"
          >
            <span>Explore Vizra</span>
            <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Hero Visual / AI Interface Area with Entrance Animation & Parallax */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full relative mt-6 md:mt-10"
      >
        <OmniaPreview yTransform={interfaceY} onOpenWorkspace={onLaunchOmnia || onExplore} />
      </motion.div>
    </section>
  );
};
