import {
  INTRO_MAX_PLAYBACK_RATE,
  SCROLL_VELOCITY_FOR_MAX_SPEED,
} from "../constants";

export function getPlaybackSpeed(
  velocity: number,
  maximum = INTRO_MAX_PLAYBACK_RATE,
) {
  const forwardVelocity = Math.max(0, velocity);
  const velocityProgress = Math.min(
    forwardVelocity / SCROLL_VELOCITY_FOR_MAX_SPEED,
    1,
  );

  return 1 + velocityProgress * (maximum - 1);
}
