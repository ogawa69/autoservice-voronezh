import type { ButtonHTMLAttributes, ReactNode, RefObject } from "react";

export interface ScrollController {
  start: () => void;
  stop: () => void;
}

export interface ContactRequestProps {
  children: ReactNode;
  scrollControllerRef?: RefObject<ScrollController | null>;
}

export type ContactTriggerProps = Pick<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "className" | "id"
>;
