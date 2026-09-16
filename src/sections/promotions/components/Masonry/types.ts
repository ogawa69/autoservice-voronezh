import type { ReactNode, RefObject } from "react";

export type MasonryAnimationOrigin =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "center"
  | "random";

export interface MasonryItem {
  id: string;
  aspect: number;
}

export type PositionedMasonryItem<T extends MasonryItem> = T & {
  x: number;
  y: number;
  width: number;
  height: number;
};

export interface MasonryLayout<T extends MasonryItem> {
  height: number;
  items: PositionedMasonryItem<T>[];
}

export interface MasonryProps<T extends MasonryItem> {
  items: readonly T[];
  renderItem: (item: PositionedMasonryItem<T>) => ReactNode;
  ease?: string;
  duration?: number;
  stagger?: number;
  animateFrom?: MasonryAnimationOrigin;
  exitDuration?: number;
  visibleThreshold?: number;
  hiddenThreshold?: number;
  scaleOnHover?: boolean;
  hoverScale?: number;
}

export interface MasonryRevealOptions {
  animateFrom: MasonryAnimationOrigin;
  containerRef: RefObject<HTMLDivElement | null>;
  duration: number;
  ease: string;
  exitDuration: number;
  hiddenThreshold: number;
  itemCount: number;
  stagger: number;
  visibleThreshold: number;
}
