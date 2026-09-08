const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const getDriveAwayTargetTime = ({
  storyProgress,
  duration,
  startSeconds,
  endSeconds,
  scrollEnd,
  frameRate,
}) => {
  const movementProgress = clamp(storyProgress / scrollEnd, 0, 1);
  const requestedSeconds =
    startSeconds +
    (Math.min(endSeconds, duration) - startSeconds) * movementProgress;

  return Math.round(requestedSeconds * frameRate) / frameRate;
};

export const getDriveAwaySeekTarget = ({
  currentTime,
  targetTime,
  frameThreshold,
  seeking,
}) => {
  if (
    seeking ||
    !Number.isFinite(currentTime) ||
    !Number.isFinite(targetTime) ||
    Math.abs(targetTime - currentTime) <= frameThreshold
  ) {
    return null;
  }

  return targetTime;
};
