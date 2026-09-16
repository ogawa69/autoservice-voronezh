interface DriveAwayTargetTimeInput {
  storyProgress: number;
  duration: number;
  startSeconds: number;
  endSeconds: number;
  scrollEnd: number;
  frameRate: number;
}

interface DriveAwaySeekTargetInput {
  currentTime: number;
  targetTime: number;
  frameThreshold: number;
  seeking: boolean;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const getDriveAwayTargetTime = ({
  storyProgress,
  duration,
  startSeconds,
  endSeconds,
  scrollEnd,
  frameRate,
}: DriveAwayTargetTimeInput) => {
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
}: DriveAwaySeekTargetInput) => {
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
