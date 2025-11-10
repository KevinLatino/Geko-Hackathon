
import { headerTextVariants } from '../animations/header-text';
import { motion } from 'framer-motion';
import { Icon } from '@stellar/design-system';
import { useAnimationOnView } from '../../hooks/useAnimationOnView';
import React, { useRef } from 'react';
import { twMerge } from 'tailwind-merge';

interface HeaderTextProps {
  tag: string;
  title: string;
  subtitle: string;
  tagClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  iconBlock?: React.ReactNode;
  align?: 'center' | 'left' | 'right';
}

export const HeaderText: React.FC<HeaderTextProps> = ({
  tag,
  title,
  subtitle,
  tagClassName,
  titleClassName,
  subtitleClassName,
  iconBlock,
  align = 'center',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controls = useAnimationOnView(containerRef);

  const alignClasses = {
    center: 'items-center text-center',
    left: 'items-start text-left',
    right: 'items-end text-right',
  };

  return (
    <motion.div
      ref={containerRef}
      className={`flex flex-col ${alignClasses[align]} space-y-5`}
      variants={headerTextVariants.container}
      initial="hidden"
      animate={controls}
    >
      <motion.div
        className="px-3.5 py-2 rounded-full border border-white/30 bg-background-geko flex items-center gap-2"
        variants={headerTextVariants.item}
      >
        {iconBlock ?? <Icon.Lightbulb01 size="sm" color="rgba(255, 255, 255, 0.8)" />}
        <span className={twMerge('text-xs text-white/80', tagClassName)}>
          {tag}
        </span>
      </motion.div>

      <motion.h2
        className={twMerge(
          'text-4xl sm:text-5xl md:text-6xl font-medium text-white max-w-3xl leading-tight',
          titleClassName,
          align === 'center'
            ? 'text-center'
            : align === 'left'
              ? 'text-left'
              : 'text-right'
        )}
        variants={headerTextVariants.item}
      >
        {title}
      </motion.h2>

      <motion.p
        className={twMerge(
          'text-base md:text-lg text-white/70 max-w-2xl leading-relaxed',
          subtitleClassName,
          align === 'center'
            ? 'text-center'
            : align === 'left'
              ? 'text-left'
              : 'text-right'
        )}
        variants={headerTextVariants.item}
      >
        {subtitle}
      </motion.p>
    </motion.div>
  );
};

export default HeaderText;