import type { ElementType, HTMLAttributes } from "react";

interface RevealHeadingOwnProps {
  as?: ElementType;
}

export type RevealHeadingProps = RevealHeadingOwnProps &
  Omit<HTMLAttributes<HTMLElement>, keyof RevealHeadingOwnProps> &
  Record<string, unknown>;
