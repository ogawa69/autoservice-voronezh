import type { MutableRefObject, RefObject } from "react";

export interface Review {
  author: string;
  car: string;
  service: string;
  title: string;
  text: string;
}

export interface DriveAwayStorySectionProps {
  reviews?: readonly Review[];
}

export interface RevealController {
  reset: () => void;
  startAnimation: () => void;
}

export type ElementRef<T extends HTMLElement = HTMLDivElement> = RefObject<T | null>;
export type MutableElementRef<T extends HTMLElement = HTMLDivElement> =
  MutableRefObject<T | null>;
export type RevealControllerRef = MutableRefObject<RevealController | null>;
export type VideoProgressController = (storyProgress: number) => void;
