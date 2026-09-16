import { motion } from "motion/react";
import type {
  ComponentProps,
  HTMLAttributes,
  MouseEventHandler,
  ReactNode,
} from "react";

export interface VerticalCutRevealHandle {
  startAnimation: () => void;
  reset: () => void;
}

export type VerticalCutRevealStaggerOrigin =
  | "first"
  | "last"
  | "center"
  | "random"
  | number;

interface VerticalCutRevealOwnProps {
  children: ReactNode;
  reverse?: boolean;
  transition?: ComponentProps<typeof motion.span>["transition"];
  splitBy?: string;
  staggerDuration?: number;
  staggerFrom?: VerticalCutRevealStaggerOrigin;
  containerClassName?: string;
  wordLevelClassName?: string;
  elementLevelClassName?: string;
  onClick?: MouseEventHandler<HTMLSpanElement>;
  onStart?: () => void;
  onComplete?: () => void;
  autoStart?: boolean;
}

export type VerticalCutRevealProps = VerticalCutRevealOwnProps &
  Omit<HTMLAttributes<HTMLSpanElement>, keyof VerticalCutRevealOwnProps>;
