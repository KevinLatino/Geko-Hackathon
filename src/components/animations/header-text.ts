import { type Variants } from 'framer-motion';

interface HeaderTextVariants {
  container: Variants;
  item: Variants;
}

export const headerTextVariants: HeaderTextVariants = {
  container: {
    hidden: {
      opacity: 0,
      y: 16,
      transition: {
        duration: 0,
      },
    },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.45,
        ease: 'easeOut',
        staggerChildren: 0.12,
      },
    },
  },
  item: {
    hidden: {
      opacity: 0,
      y: 12,
    },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
  },
};

export type { HeaderTextVariants };