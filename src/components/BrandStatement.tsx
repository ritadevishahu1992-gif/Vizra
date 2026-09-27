import React, { useRef } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'motion/react';
import { VizraMark } from './VizraLogo';

interface WordProps {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
}

const Word: React.FC<WordProps> = ({ children, progress, range }) => {
  const opacity = useTransform(progress, range, [0.2, 1]);
  const color = useTransform(progress, range, ['hsl(0 0% 35%)', 'hsl(0 0% 100%)']);

  return (
    <motion.span
      style={{ opacity, color }}
      className="mr-[0.3em] inline-block transition-colors will-change-[color,opacity]"
    >
      {children}
    </motion.span>
  );
};

export const BrandStatement: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Reading progress for the word reveal (from when section enters to when it hits center)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end center'],
  });

  // Track overall section presence in viewport to smoothly fade indicator in and out
  const { scrollYProgress: sectionPresence } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const indicatorOpacity = useTransform(
    sectionPresence,
    [0, 0.08, 0.88, 1],
    [0, 1, 1, 0]
  );

  const statement =
    'The future of creativity belongs to people who can turn ideas into experiences. Vizra gives creators intelligent tools to imagine, build, animate, and experiment faster.';

  const words = statement.split(' ');
  const total = words.length;

  return (
    <section
      id="philosophy"
      ref={containerRef}
      className="min-h-screen flex flex-col items-center justify-center py-24 md:py-32 px-8 md:px-28 bg-black relative selection:bg-[#eb3b2d] selection:text-white"
    >
      {/* Subtle, thin scroll progress indicator at the top of the viewport */}
      <motion.div
        style={{ opacity: indicatorOpacity }}
        className="fixed top-0 left-0 right-0 z-[60] pointer-events-none"
        aria-label="Reading progress indicator"
      >
        <div className="w-full h-[2px] bg-white/[0.05]">
          <motion.div
            style={{ scaleX: scrollYProgress, transformOrigin: '0%' }}
            className="h-full w-full bg-gradient-to-r from-neutral-200 via-[#eb3b2d] to-[#eb3b2d] shadow-[0_0_8px_rgba(235,59,45,0.7)] will-change-transform"
          />
        </div>
      </motion.div>

      {/* Decorative Minimal Mark: Vizra symbol / abstract red mark */}
      <div className="mb-12">
        <VizraMark className="w-14 h-10 object-contain" />
      </div>

      {/* Main Editorial Statement with Scroll-driven Word Reveal */}
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-medium leading-[1.2] tracking-tight flex flex-wrap justify-center text-center">
          {words.map((word, i) => {
            const start = i / total;
            const end = (i + 1) / total;
            return (
              <Word key={i} progress={scrollYProgress} range={[start, end]}>
                {word}
              </Word>
            );
          })}
        </h2>
      </div>

      {/* Closing Brand Line */}
      <div className="mt-14 text-center">
        <span className="text-sm font-medium tracking-wider text-neutral-500 uppercase">
          Vizra / Omnia 1.0
        </span>
      </div>
    </section>
  );
};
