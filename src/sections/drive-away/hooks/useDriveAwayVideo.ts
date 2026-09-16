import { useEffect, useRef, useState } from "react";
import ScrollyVideo from "scrolly-video/dist/ScrollyVideo.js";
import { DRIVE_AWAY_VIDEO } from "../model/constants";
import {
  getDriveAwaySeekTarget,
  getDriveAwayTargetTime,
} from "../model/driveAwayVideoState";
import type {
  ElementRef,
  VideoProgressController,
} from "../types";
import type { MutableRefObject } from "react";

interface UseDriveAwayVideoOptions {
  mediaMountRef: ElementRef;
  reduceMotion: boolean;
  storyProgressRef: MutableRefObject<number>;
}

export const useDriveAwayVideo = ({
  mediaMountRef,
  reduceMotion,
  storyProgressRef,
}: UseDriveAwayVideoOptions) => {
  const controllerRef = useRef<VideoProgressController | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoLoadAttempt, setVideoLoadAttempt] = useState(0);

  useEffect(() => {
    const container = mediaMountRef.current;
    if (!container || reduceMotion || videoFailed) return undefined;

    let active = true;
    let ready = false;
    let initialFrameReady = false;
    let driveRaf: number | null = null;
    let retryTimeout = 0;
    let retryScheduled = false;
    let targetSeconds: number = DRIVE_AWAY_VIDEO.startSeconds;
    const mount = document.createElement("div");
    mount.setAttribute("data-drive-away-mount", "");
    container.replaceChildren(mount);

    const instance = new ScrollyVideo({
      src: DRIVE_AWAY_VIDEO.source,
      scrollyVideoContainer: mount,
      cover: true,
      sticky: false,
      full: false,
      trackScroll: false,
      lockScroll: false,
      frameThreshold: DRIVE_AWAY_VIDEO.frameThreshold,
      useWebCodecs: false,
    });

    instance.video.muted = true;
    instance.video.playsInline = true;
    instance.video.preload = "auto";
    instance.video.tabIndex = -1;
    instance.video.disablePictureInPicture = true;
    instance.video.setAttribute("aria-hidden", "true");

    const scheduleDrive = () => {
      if (!active || driveRaf !== null) return;
      driveRaf = requestAnimationFrame(driveVideo);
    };

    const driveVideo = () => {
      driveRaf = null;
      if (!active || !ready || !initialFrameReady) return;

      const video = instance.video;
      const seekTarget = getDriveAwaySeekTarget({
        currentTime: video.currentTime,
        targetTime: targetSeconds,
        frameThreshold: DRIVE_AWAY_VIDEO.frameThreshold,
        seeking: video.seeking,
      });

      video.pause();
      video.playbackRate = 1;
      instance.currentTime = video.currentTime;
      instance.targetTime = targetSeconds;
      if (seekTarget !== null) video.currentTime = seekTarget;
    };

    const syncVideo: VideoProgressController = (storyProgress) => {
      if (!active || !ready || !Number.isFinite(instance.video.duration)) return;

      targetSeconds = getDriveAwayTargetTime({
        storyProgress,
        duration: instance.video.duration,
        startSeconds: DRIVE_AWAY_VIDEO.startSeconds,
        endSeconds: DRIVE_AWAY_VIDEO.endSeconds,
        scrollEnd: DRIVE_AWAY_VIDEO.scrollEnd,
        frameRate: DRIVE_AWAY_VIDEO.frameRate,
      });
      instance.targetTime = targetSeconds;

      if (!initialFrameReady) {
        instance.video.pause();
        instance.currentTime = targetSeconds;
        instance.video.currentTime = targetSeconds;
        return;
      }

      scheduleDrive();
    };

    const handleSeeked = () => {
      instance.currentTime = instance.video.currentTime;
      if (initialFrameReady) scheduleDrive();
    };

    const revealVideo = () => {
      if (
        !active ||
        initialFrameReady ||
        instance.video.seeking ||
        Math.abs(instance.video.currentTime - targetSeconds) >
          DRIVE_AWAY_VIDEO.frameThreshold
      ) {
        return;
      }

      initialFrameReady = true;
      instance.video.removeEventListener("seeked", revealVideo);
      setVideoReady(true);
      scheduleDrive();
    };

    const markReady = () => {
      if (!active || ready || !Number.isFinite(instance.video.duration)) return;
      ready = true;
      controllerRef.current = syncVideo;
      instance.video.addEventListener("seeked", revealVideo);
      syncVideo(storyProgressRef.current);
    };

    const handleError = () => {
      if (!active || retryScheduled) return;
      setVideoReady(false);

      if (videoLoadAttempt >= DRIVE_AWAY_VIDEO.maxRetries) {
        setVideoFailed(true);
        return;
      }

      retryScheduled = true;
      retryTimeout = window.setTimeout(() => {
        if (active) setVideoLoadAttempt((attempt) => attempt + 1);
      }, DRIVE_AWAY_VIDEO.retryDelay);
    };

    instance.video.addEventListener("loadedmetadata", markReady);
    instance.video.addEventListener("loadeddata", markReady);
    instance.video.addEventListener("canplay", markReady);
    instance.video.addEventListener("seeked", handleSeeked);
    instance.video.addEventListener("error", handleError);
    if (instance.video.readyState >= HTMLMediaElement.HAVE_METADATA) markReady();

    return () => {
      active = false;
      window.clearTimeout(retryTimeout);
      instance.video.removeEventListener("loadedmetadata", markReady);
      instance.video.removeEventListener("loadeddata", markReady);
      instance.video.removeEventListener("canplay", markReady);
      instance.video.removeEventListener("seeked", handleSeeked);
      instance.video.removeEventListener("error", handleError);
      instance.video.removeEventListener("seeked", revealVideo);
      if (controllerRef.current === syncVideo) controllerRef.current = null;
      if (instance.transitioningRaf) {
        cancelAnimationFrame(instance.transitioningRaf);
        instance.transitioningRaf = null;
      }
      if (driveRaf !== null) cancelAnimationFrame(driveRaf);
      instance.destroy();
      instance.video.pause();
      instance.video.removeAttribute("src");
      instance.video.load();
      mount.remove();
    };
  }, [mediaMountRef, reduceMotion, storyProgressRef, videoFailed, videoLoadAttempt]);

  return { videoReady, videoFailed, controllerRef };
};
