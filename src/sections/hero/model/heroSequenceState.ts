export const HERO_SEQUENCE_PHASE = {
  LOADING: "loading",
  INTRO: "intro",
  SCRUB: "scrub",
  FALLBACK: "fallback",
} as const;

export type HeroSequencePhase =
  (typeof HERO_SEQUENCE_PHASE)[keyof typeof HERO_SEQUENCE_PHASE];

const clamp = (minimum: number, maximum: number, value: number) =>
  Math.min(maximum, Math.max(minimum, value));

export const getEngineProgress = (
  scrollProgress: number,
  startProgress: number,
  endProgress: number,
) =>
  clamp(
    0,
    1,
    (scrollProgress - startProgress) / (endProgress - startProgress),
  );

export const resolveEngineProgress = ({
  phase,
  previousProgress = 0,
  scrollProgress,
  startProgress,
  endProgress,
}: {
  phase: HeroSequencePhase;
  previousProgress?: number;
  scrollProgress: number;
  startProgress: number;
  endProgress: number;
}) =>
  phase === HERO_SEQUENCE_PHASE.SCRUB
    ? getEngineProgress(scrollProgress, startProgress, endProgress)
    : previousProgress;

export const getMasterTargetTime = ({
  duration,
  introEndTime,
  engineProgress,
}: {
  duration: number;
  introEndTime: number;
  engineProgress: number;
}) => {
  const resolvedIntroEndTime = Math.min(introEndTime, duration);
  const engineDuration = Math.max(0, duration - resolvedIntroEndTime);

  return resolvedIntroEndTime + engineDuration * clamp(0, 1, engineProgress);
};

export const canEnterScrub = ({
  phase,
  introMediaComplete,
  copyHoldComplete,
}: {
  phase: HeroSequencePhase;
  introMediaComplete: boolean;
  copyHoldComplete: boolean;
}) =>
  phase === HERO_SEQUENCE_PHASE.INTRO &&
  introMediaComplete &&
  copyHoldComplete;
