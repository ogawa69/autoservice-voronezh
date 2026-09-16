import { useSpring } from "motion/react";
import type { ReactNode, RefObject } from "react";

export type MarqueeDirection = "left" | "right" | "up" | "down";
export type MarqueeSpringConfig = NonNullable<
  Parameters<typeof useSpring>[1]
>;

export interface SimpleMarqueeProps {
  children?: ReactNode;
  className?: string;
  direction?: MarqueeDirection;
  baseVelocity?: number;
  slowdownOnHover?: boolean;
  slowDownFactor?: number;
  slowDownSpringConfig?: MarqueeSpringConfig;
  useScrollVelocity?: boolean;
  scrollAwareDirection?: boolean;
  scrollSpringConfig?: MarqueeSpringConfig;
  scrollContainer?: RefObject<HTMLElement | null>;
  active?: boolean;
  repeat?: number;
  draggable?: boolean;
  dragSensitivity?: number;
  dragVelocityDecay?: number;
  dragAwareDirection?: boolean;
  dragAngle?: number;
  grabCursor?: boolean;
  easing?: (value: number) => number;
}
