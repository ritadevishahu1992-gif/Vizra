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
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      className={`group relative inline-flex items-center justify-center gap-3 bg-white text-black rounded-full px-8 py-3.5 text-base font-medium shadow-xl hover:bg-neutral-100 transition-colors cursor-pointer select-none ${className}`}
    >
      <span>Explore Vizra</span>

      {showIcon && (
        <span className="flex items-center justify-center w-5 h-5 rounded-full bg-black/10 group-hover:bg-[#eb3b2d] group-hover:text-white transition-colors duration-200">
          <ArrowUpRight size={13} className="text-black group-hover:text-white transition-colors" />
        </span>
      )}
    </motion.button>
  );
};
