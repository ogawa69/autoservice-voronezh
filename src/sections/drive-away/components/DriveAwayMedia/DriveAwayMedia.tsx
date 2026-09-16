import { DRIVE_AWAY_VIDEO } from "../../model/constants";
import type { ElementRef } from "../../types";

interface DriveAwayMediaProps {
  mediaMountRef: ElementRef;
  reduceMotion: boolean;
  videoFailed: boolean;
}
export function DriveAwayMedia({
  mediaMountRef,
  reduceMotion,
  videoFailed,
}: DriveAwayMediaProps) {
  return (
    <div className="drive-away-story__media" aria-hidden="true">
      <img
        className="drive-away-story__poster"
        src={
          reduceMotion || videoFailed
            ? DRIVE_AWAY_VIDEO.emptyPoster
            : DRIVE_AWAY_VIDEO.startPoster
        }
        width="1916"
        height="1080"
        loading="lazy"
        alt=""
      />
      {!reduceMotion && !videoFailed && (
        <div ref={mediaMountRef} className="drive-away-story__video" />
      )}
    </div>
  );
}
