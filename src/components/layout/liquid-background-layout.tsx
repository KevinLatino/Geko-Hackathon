
import type { ReactNode } from 'react';
import LiquidEther from '../ui/LiquidEther';
import type { LiquidEtherProps } from '../ui/LiquidEther';

interface LiquidBackgroundLayoutProps {
  children: ReactNode;
  liquidConfig?: Partial<LiquidEtherProps>;
  className?: string;
}

const DEFAULT_LIQUID_CONFIG: Partial<LiquidEtherProps> = {
  mouseForce: 30,
  cursorSize: 65,
  resolution: 0.5,
  colors: ['#1FD2FF', '#1A53FF', '#1FC7FF'],
  autoDemo: true,
  autoSpeed: 0.5,
  autoIntensity: 2.2,
  takeoverDuration: 0.25,
  autoResumeDelay: 500,
  autoRampDuration: 0.6,
  autoWhileHovered: true,
};

export function LiquidBackgroundLayout({
  children,
  liquidConfig,
  className = '',
}: LiquidBackgroundLayoutProps) {
  const finalConfig = { ...DEFAULT_LIQUID_CONFIG, ...liquidConfig };

  return (
    <div
      className={`relative w-full overflow-hidden bg-[#0A0A0A] ${className}`}
    >
      <div className="absolute inset-0 z-0">
        <LiquidEther
          colors={finalConfig.colors}
          mouseForce={finalConfig.mouseForce}
          cursorSize={finalConfig.cursorSize}
          isViscous={false}
          viscous={30}
          iterationsViscous={32}
          iterationsPoisson={32}
          resolution={finalConfig.resolution}
          isBounce={false}
          autoDemo={finalConfig.autoDemo}
          autoSpeed={finalConfig.autoSpeed}
          autoIntensity={finalConfig.autoIntensity}
          takeoverDuration={finalConfig.takeoverDuration}
          autoResumeDelay={finalConfig.autoResumeDelay}
          autoRampDuration={finalConfig.autoRampDuration}
          autoWhileHovered={finalConfig.autoWhileHovered}
        />
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}