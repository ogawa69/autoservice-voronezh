export const PRICE_CARD_CHASE_EASING = 0.115;
export const PRICE_CARD_HALF_TURN_DEGREES = 180;
export const PRICE_CARD_MAX_DEGREES_PER_SECOND = 600;
export const PRICE_CARD_MAX_DEGREES_PER_FRAME = 10;
export const PRICE_CARD_MAX_FRAME_DELTA_MS = 1000 / 60;
export const PRICE_CARD_SETTLE_EPSILON = 0.0001;

const clamp = (value, minimum, maximum) =>
  Math.min(maximum, Math.max(minimum, value));

/**
 * Advances the rendered scroll progress by one animation frame.
 *
 * Progress spans every half-turn between services, so the angular limit stays
 * constant even when the number of services changes.
 */
export function advancePriceCardProgress({
  renderedProgress,
  targetProgress,
  serviceCount,
  deltaMs = PRICE_CARD_MAX_FRAME_DELTA_MS,
}) {
  const difference = targetProgress - renderedProgress;
  if (difference === 0) return targetProgress;

  const totalRotationDegrees =
    Math.max(0, serviceCount - 1) * PRICE_CARD_HALF_TURN_DEGREES;

  // With fewer than two services, progress has no visible rotational distance.
  if (totalRotationDegrees === 0) return targetProgress;

  const resolvedDeltaMs = Number.isFinite(deltaMs)
    ? clamp(deltaMs, 0, PRICE_CARD_MAX_FRAME_DELTA_MS)
    : PRICE_CARD_MAX_FRAME_DELTA_MS;
  const maxRotationStep = Math.min(
    PRICE_CARD_MAX_DEGREES_PER_FRAME,
    (PRICE_CARD_MAX_DEGREES_PER_SECOND * resolvedDeltaMs) / 1000,
  );
  const maxProgressStep = maxRotationStep / totalRotationDegrees;

  let easedProgress =
    renderedProgress + difference * PRICE_CARD_CHASE_EASING;

  if (Math.abs(targetProgress - easedProgress) < PRICE_CARD_SETTLE_EPSILON) {
    easedProgress = targetProgress;
  }

  const easedStep = easedProgress - renderedProgress;
  const boundedStep =
    Math.sign(easedStep) *
    Math.min(Math.abs(easedStep), Math.abs(difference), maxProgressStep);
  const nextProgress = renderedProgress + boundedStep;

  return difference > 0
    ? Math.min(nextProgress, targetProgress)
    : Math.max(nextProgress, targetProgress);
}
