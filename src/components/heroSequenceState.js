export const HERO_SEQUENCE_PHASE = Object.freeze({
  LOADING: "loading",
  INTRO: "intro",
  SCRUB: "scrub",
  FALLBACK: "fallback",
});

const clamp = (minimum, maximum, value) =>
  Math.min(maximum, Math.max(minimum, value));

export const getEngineProgress = (
  scrollProgress,
  startProgress,
  endProgress,
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
}) =>
  phase === HERO_SEQUENCE_PHASE.SCRUB
    ? getEngineProgress(scrollProgress, startProgress, endProgress)
    : previousProgress;

export const getMasterTargetTime = ({
  duration,
  introEndTime,
  engineProgress,
}) => {
  const resolvedIntroEndTime = Math.min(introEndTime, duration);
  const engineDuration = Math.max(0, duration - resolvedIntroEndTime);

  return resolvedIntroEndTime + engineDuration * clamp(0, 1, engineProgress);
};

export const canEnterScrub = ({
  phase,
  introMediaComplete,
  copyHoldComplete,
}) =>
  phase === HERO_SEQUENCE_PHASE.INTRO &&
  introMediaComplete &&
  copyHoldComplete;
