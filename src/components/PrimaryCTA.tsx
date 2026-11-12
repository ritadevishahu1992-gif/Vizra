import React from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';

interface PrimaryCTAProps {
  onClick?: () => void;
  className?: string;
  showIcon?: boolean;
}

export const PrimaryCTA: React.FC<PrimaryCTAProps> = ({
  onClick,
  className = '',
  showIcon = true,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      className={`group relative inline-flex items-center justify-center gap-3 bg-white text-black rounded-full px-8 py-3.5 text-base font-medium shadow-xl hover:bg-neutral-100 transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eb3b2d] focus-visible:ring-offset-2 focus-visible:ring-offset-black ${className}`}
    >
      <span>Explore Vizra</span>

      {showIcon && (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-black/10 group-hover:bg-[#eb3b2d] group-hover:text-white group-focus-visible:bg-[#eb3b2d] group-focus-visible:text-white transition-colors duration-200">
          <ArrowUpRight size={13} className="text-black group-hover:text-white group-focus-visible:text-white transition-colors" />
        </span>
      )}
    </motion.button>
  );
};
