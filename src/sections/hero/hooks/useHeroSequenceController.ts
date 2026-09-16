import { useCallback, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import {
  COPY_FULLY_VISIBLE_HOLD,
  COPY_REVEAL_BASE_DURATION,
  COPY_REVEAL_MIN_DURATION,
  COPY_REVEAL_MIN_STAGGER,
  COPY_REVEAL_STAGGER,
} from "../constants";
import { HERO_SEQUENCE_PHASE } from "../model/heroSequenceState";
import type { HeroSequencePhase } from "../model/heroSequenceState";
import type {
  HeroRefs,
  HeroRuntimeRefs,
  HeroStateSetters,
  RevealHandle,
} from "../types";
import { useHeroMediaSequence } from "./useHeroMediaSequence";
import { useHeroScrollTimeline } from "./useHeroScrollTimeline";
import { useHoodCtaReveal } from "./useHoodCtaReveal";

export function useHeroSequenceController() {
  const sequenceRef = useRef<HTMLDivElement>(null);
  const animationEndRef = useRef<HTMLSpanElement>(null);
  const heroNavRef = useRef<HTMLElement>(null);
  const heroCopyRef = useRef<HTMLDivElement>(null);
  const engineLayerRef = useRef<HTMLElement>(null);
  const masterMediaRef = useRef<HTMLDivElement>(null);
  const scrollyContainerRef = useRef<HTMLDivElement>(null);
  const hoodTitleRef = useRef<RevealHandle>(null);
  const hoodActionRef = useRef<HTMLDivElement>(null);
  const hoodTriggerRef = useRef<HTMLSpanElement>(null);

  const masterProgressControllerRef = useRef<
    | ((
        progress: number,
        options?: { jump?: boolean; velocity?: number },
      ) => void)
    | null
  >(null);
  const heroTimelineControllerRef = useRef<
    HeroRuntimeRefs["heroTimelineControllerRef"]["current"]
  >(null);
  const enterScrubControllerRef = useRef<
    HeroRuntimeRefs["enterScrubControllerRef"]["current"]
  >(null);
  const engineProgressRef = useRef(0);
  const sequencePhaseRef = useRef(HERO_SEQUENCE_PHASE.LOADING);
  const introMediaCompleteRef = useRef(false);
  const copyRevealStartedRef = useRef(false);
  const copyRevealCompleteRef = useRef(false);
  const copyHoldCompleteRef = useRef(false);
  const copyHoldTimeoutRef = useRef(0);
  const sequenceSpeedRef = useRef(1);

  const reduceMotion = Boolean(useReducedMotion());
  const [copyRevealed, setCopyRevealed] = useState(false);
  const [copyRevealDuration, setCopyRevealDuration] = useState(
    COPY_REVEAL_BASE_DURATION,
  );
  const [copyRevealInstant, setCopyRevealInstant] = useState(false);
  const [sequencePhase, setSequencePhase] = useState<HeroSequencePhase>(
    HERO_SEQUENCE_PHASE.LOADING,
  );
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoLoadAttempt, setVideoLoadAttempt] = useState(0);
  const [engineVideoReady, setEngineVideoReady] = useState(false);
  const [engineHoodOpen, setEngineHoodOpen] = useState(false);
  const [hoodRevealRate, setHoodRevealRate] = useState(1);
  const [hoodCopyVisible, setHoodCopyVisible] = useState(false);
  const [hoodRevealCycle, setHoodRevealCycle] = useState(0);

  const refs: HeroRefs = {
    sequenceRef,
    animationEndRef,
    heroNavRef,
    heroCopyRef,
    engineLayerRef,
    masterMediaRef,
    scrollyContainerRef,
    hoodTitleRef,
    hoodActionRef,
    hoodTriggerRef,
  };

  const runtime: HeroRuntimeRefs = {
    masterProgressControllerRef,
    heroTimelineControllerRef,
    enterScrubControllerRef,
    engineProgressRef,
    sequencePhaseRef,
    introMediaCompleteRef,
    copyRevealStartedRef,
    copyRevealCompleteRef,
    copyHoldCompleteRef,
    copyHoldTimeoutRef,
    sequenceSpeedRef,
  };

  const setters: HeroStateSetters = {
    setCopyRevealed,
    setCopyRevealDuration,
    setCopyRevealInstant,
    setSequencePhase,
    setVideoFailed,
    setVideoLoadAttempt,
    setEngineVideoReady,
    setEngineHoodOpen,
    setHoodRevealRate,
    setHoodCopyVisible,
    setHoodRevealCycle,
  };

  const revealCopy = useCallback((playbackRate = 1) => {
    if (copyRevealStartedRef.current) return;

    copyRevealStartedRef.current = true;
    setCopyRevealInstant(false);
    setCopyRevealDuration(
      Math.max(
        COPY_REVEAL_MIN_DURATION,
        Math.round(COPY_REVEAL_BASE_DURATION / playbackRate),
      ),
    );
    setCopyRevealed(true);
  }, []);

  const handleHeroCopyRevealComplete = useCallback(() => {
    if (copyRevealCompleteRef.current) return;

    copyRevealCompleteRef.current = true;
    window.clearTimeout(copyHoldTimeoutRef.current);
    copyHoldTimeoutRef.current = window.setTimeout(() => {
      copyHoldCompleteRef.current = true;
      enterScrubControllerRef.current?.();
    }, COPY_FULLY_VISIBLE_HOLD);
  }, []);

  useHeroMediaSequence({
    refs,
    runtime,
    setters,
    reduceMotion,
    videoFailed,
    videoLoadAttempt,
    revealCopy,
  });
  useHeroScrollTimeline({ refs, runtime, reduceMotion, videoFailed });
  useHoodCtaReveal({
    refs,
    setters,
    reduceMotion,
    videoFailed,
    engineVideoReady,
    engineHoodOpen,
    hoodRevealRate,
  });

  const copyVisible = reduceMotion || videoFailed || copyRevealed;
  const staticHoodContent = reduceMotion || videoFailed;
  const copyRevealDurationSeconds = copyRevealInstant
    ? 0
    : copyRevealDuration / 1000;
  const copyRevealStaggerSeconds = copyRevealInstant
    ? 0
    : Math.max(
        COPY_REVEAL_MIN_STAGGER,
        Math.round(
          (copyRevealDuration / COPY_REVEAL_BASE_DURATION) *
            COPY_REVEAL_STAGGER,
        ),
      ) / 1000;

  return {
    refs,
    reduceMotion,
    videoFailed,
    engineVideoReady,
    introComplete: sequencePhase === HERO_SEQUENCE_PHASE.SCRUB,
    sequencePhase,
    copyVisible,
    staticHoodContent,
    copyRevealDurationSeconds,
    copyRevealStaggerSeconds,
    hoodRevealRate,
    hoodCopyVisible,
    hoodRevealCycle,
    handleHeroCopyRevealComplete,
  };
}
