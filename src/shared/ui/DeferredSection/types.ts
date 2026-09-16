import type { CSSProperties, ReactNode } from "react";

export interface DeferredSectionProps {
  children: ReactNode;
  className?: string;
  minHeight?: CSSProperties["minHeight"];
  rootMargin?: string;
}
