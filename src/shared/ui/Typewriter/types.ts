import { motion } from "motion/react";
import type {
  ComponentProps,
  ComponentPropsWithoutRef,
  ElementType,
} from "react";

export type TypewriterText = string | readonly string[];

interface TypewriterOwnProps<TElement extends ElementType> {
  text: TypewriterText;
  as?: TElement;
  speed?: number;
  initialDelay?: number;
  waitTime?: number;
  deleteSpeed?: number;
  loop?: boolean;
  className?: string;
  showCursor?: boolean;
  hideCursorOnType?: boolean;
  cursorChar?: string;
  cursorClassName?: string;
  cursorAnimationVariants?: ComponentProps<typeof motion.span>["variants"];
}

export type TypewriterProps<TElement extends ElementType = "div"> =
  TypewriterOwnProps<TElement> &
    Omit<ComponentPropsWithoutRef<TElement>, keyof TypewriterOwnProps<TElement>>;
