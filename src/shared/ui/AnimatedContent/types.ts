import type {
  CSSProperties,
  ElementType,
  HTMLAttributes,
  ReactNode,
} from "react";

export type AnimatedContentDirection = "horizontal" | "vertical";
export type AnimatedContentContainer = Element | string | null;

interface AnimatedContentOwnProps {
  children?: ReactNode;
  container?: AnimatedContentContainer;
  distance?: number;
  direction?: AnimatedContentDirection;
  reverse?: boolean;
  duration?: number;
  ease?: string;
  initialOpacity?: number;
  animateOpacity?: boolean;
  scale?: number;
  threshold?: number;
  delay?: number;
  disappearAfter?: number;
  disappearDuration?: number;
  disappearEase?: string;
  onComplete?: () => void;
  onDisappearanceComplete?: () => void;
  active?: boolean;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
}

export type AnimatedContentProps = AnimatedContentOwnProps &
  Omit<HTMLAttributes<HTMLElement>, keyof AnimatedContentOwnProps> &
  Record<string, unknown>;
