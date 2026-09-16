import type {
  Dispatch,
  MutableRefObject,
  RefObject,
  SetStateAction,
} from "react";
import type { HeroSequencePhase } from "./model/heroSequenceState";

export type RevealHandle = {
  reset(): void;
  startAnimation(): void;
};

export type HeroTimelineController = {
  disable(): void;
  enable(options?: { jump?: boolean }): void;
  showStatic(): void;
};

export type HeroRefs = {
  sequenceRef: RefObject<HTMLDivElement | null>;
  animationEndRef: RefObject<HTMLSpanElement | null>;
  heroNavRef: RefObject<HTMLElement | null>;
  heroCopyRef: RefObject<HTMLDivElement | null>;
  engineLayerRef: RefObject<HTMLElement | null>;
  masterMediaRef: RefObject<HTMLDivElement | null>;
  scrollyContainerRef: RefObject<HTMLDivElement | null>;
  hoodTitleRef: RefObject<RevealHandle | null>;
  hoodActionRef: RefObject<HTMLDivElement | null>;
  hoodTriggerRef: RefObject<HTMLSpanElement | null>;
};

export type HeroRuntimeRefs = {
  masterProgressControllerRef: MutableRefObject<
    | ((
        progress: number,
        options?: { jump?: boolean; velocity?: number },
      ) => void)
    | null
  >;
  heroTimelineControllerRef: MutableRefObject<HeroTimelineController | null>;
  enterScrubControllerRef: MutableRefObject<
    ((options?: { force?: boolean; jump?: boolean }) => void) | null
  >;
  engineProgressRef: MutableRefObject<number>;
  sequencePhaseRef: MutableRefObject<HeroSequencePhase>;
  introMediaCompleteRef: MutableRefObject<boolean>;
  copyRevealStartedRef: MutableRefObject<boolean>;
  copyRevealCompleteRef: MutableRefObject<boolean>;
  copyHoldCompleteRef: MutableRefObject<boolean>;
  copyHoldTimeoutRef: MutableRefObject<number>;
  sequenceSpeedRef: MutableRefObject<number>;
};

export type HeroStateSetters = {
  setCopyRevealed: Dispatch<SetStateAction<boolean>>;
  setCopyRevealDuration: Dispatch<SetStateAction<number>>;
  setCopyRevealInstant: Dispatch<SetStateAction<boolean>>;
  setSequencePhase: Dispatch<SetStateAction<HeroSequencePhase>>;
  setVideoFailed: Dispatch<SetStateAction<boolean>>;
  setVideoLoadAttempt: Dispatch<SetStateAction<number>>;
  setEngineVideoReady: Dispatch<SetStateAction<boolean>>;
  setEngineHoodOpen: Dispatch<SetStateAction<boolean>>;
  setHoodRevealRate: Dispatch<SetStateAction<number>>;
  setHoodCopyVisible: Dispatch<SetStateAction<boolean>>;
  setHoodRevealCycle: Dispatch<SetStateAction<number>>;
};

export type HeroSectionProps = Record<string, never>;
