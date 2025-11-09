import { useAnimation, useInView } from 'framer-motion';
import { useEffect } from 'react';



export const useAnimationOnView = <T extends HTMLElement = HTMLElement>(
  ref: React.RefObject<T | null>,
  threshold: number = 0.35
) => {
  const controls = useAnimation();
  const isInView = useInView(ref, { amount: threshold });

  useEffect(() => {
    controls.start(isInView ? 'show' : 'hidden');
  }, [controls, isInView]);

  return controls;
};