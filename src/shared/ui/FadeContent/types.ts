import type { HTMLAttributes } from "react";

interface FadeContentOwnProps {
  container?: Element | string | null;
  blur?: boolean;
  offsetY?: number;
  duration?: number;
  ease?: string;
  easing?: string;
  delay?: number;
  threshold?: number;
  initialOpacity?: number;
  disappearAfter?: number;
  disappearDuration?: number;
  disappearEase?: string;
  onComplete?: () => void;
  onDisappearanceComplete?: () => void;
  active?: boolean;
}

export type FadeContentProps = FadeContentOwnProps &
  Omit<HTMLAttributes<HTMLDivElement>, keyof FadeContentOwnProps>;
