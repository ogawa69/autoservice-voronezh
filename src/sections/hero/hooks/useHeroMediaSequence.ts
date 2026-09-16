import { useEffect } from "react";
import ScrollyVideo from "scrolly-video/dist/ScrollyVideo.js";
import {
  COPY_REVEAL_BASE_DURATION,
  COPY_REVEAL_TIME,
  ENGINE_HOOD_OPEN_PROGRESS,
  ENGINE_VIDEO_READY_TIMEOUT,
  INTRO_MAX_PLAYBACK_RATE,
  LOCKED_SCROLL_TOLERANCE,
  MASTER_INTRO_END_TIME,
  MASTER_VIDEO_MAX_RETRIES,
  MASTER_VIDEO_RETRY_DELAY,
  MASTER_VIDEO_SRC,
  SCROLLY_FRAME_THRESHOLD,
  SCROLLY_TRANSITION_SPEED,
} from "../constants";
import { getPlaybackSpeed } from "../lib/getPlaybackSpeed";
import {
  HERO_SEQUENCE_PHASE,
  canEnterScrub,
  getMasterTargetTime,
} from "../model/heroSequenceState";
import type { HeroSequencePhase } from "../model/heroSequenceState";
import type {
  HeroRefs,
  HeroRuntimeRefs,
  HeroStateSetters,
} from "../types";

export function useHeroMediaSequence({
  refs,
  runtime,
  setters,
  reduceMotion,
  videoFailed,
  videoLoadAttempt,
  revealCopy,
}: {
  refs: HeroRefs;
  runtime: HeroRuntimeRefs;
  setters: HeroStateSetters;
  reduceMotion: boolean;
  videoFailed: boolean;
  videoLoadAttempt: number;
  revealCopy(playbackRate?: number): void;
}) {
  const {
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
  } = runtime;
  const {
    scrollyContainerRef,
    masterMediaRef,
    sequenceRef,
  } = refs;
  const {
    setCopyRevealed,
    setCopyRevealDuration,
    setCopyRevealInstant,
    setSequencePhase,
    setVideoFailed,
    setVideoLoadAttempt,
    setEngineVideoReady,
    setEngineHoodOpen,
    setHoodRevealRate,
  } = setters;

  useEffect(() => {
    const container = scrollyContainerRef.current;
    const media = masterMediaRef.current;
    const sequence = sequenceRef.current;
    if (!container || !sequence || reduceMotion || videoFailed) return undefined;

    let active = true;
    let ready = false;
    let readyTimeout = 0;
    let retryTimeout = 0;
    let retryScheduled = false;
    let introWatchdogTimeout = 0;
    let copyFallbackTimeout = 0;
    let introFrame = 0;
    let hoodOpen = false;
    let scrollGateActive = false;
    let lockedScrollY = 0;
    let lastInputTime = 0;
    let lastTouchY: number | null = null;

    sequencePhaseRef.current = HERO_SEQUENCE_PHASE.LOADING;
    introMediaCompleteRef.current = false;
    copyRevealStartedRef.current = false;
    copyRevealCompleteRef.current = false;
    copyHoldCompleteRef.current = false;
    sequenceSpeedRef.current = 1;
    engineProgressRef.current = 0;
    window.clearTimeout(copyHoldTimeoutRef.current);
    setSequencePhase(HERO_SEQUENCE_PHASE.LOADING);
    setCopyRevealed(false);
    setCopyRevealDuration(COPY_REVEAL_BASE_DURATION);
    setCopyRevealInstant(false);
    setEngineVideoReady(false);
    setEngineHoodOpen(false);
    media?.removeAttribute("data-ready");

    // ScrollyVideo does not cancel an in-progress WebCodecs decode on destroy.
    // A disposable mount keeps any late work from an obsolete StrictMode effect
    // detached from the live media layer.
    const mount = document.createElement("div");
    mount.setAttribute("data-scrolly-mount", "");
    container.replaceChildren(mount);

    const instance = new ScrollyVideo({
      src: MASTER_VIDEO_SRC,
      scrollyVideoContainer: mount,
      transitionSpeed: SCROLLY_TRANSITION_SPEED,
      frameThreshold: SCROLLY_FRAME_THRESHOLD,
      cover: true,
      sticky: false,
      full: false,
      trackScroll: false,
      lockScroll: false,
      // The master asset has a keyframe on every frame. Native seeking keeps
      // forward acceleration and reverse scrubbing precise without a canvas copy.
      useWebCodecs: false,
    });

    instance.video.tabIndex = -1;
    instance.video.setAttribute("aria-hidden", "true");
    instance.video.disablePictureInPicture = true;

    const getIntroEndTime = () =>
      Math.min(MASTER_INTRO_END_TIME, instance.video.duration);

    const getMasterPercentage = (engineProgress: number) => {
      const introEndTime = getIntroEndTime();
      const targetTime = getMasterTargetTime({
        duration: instance.video.duration,
        introEndTime,
        engineProgress,
      });

      return targetTime / instance.video.duration;
    };

    const setPhase = (nextPhase: HeroSequencePhase) => {
      sequencePhaseRef.current = nextPhase;
      setSequencePhase(nextPhase);
    };

    const showCopyInstantly = () => {
      copyRevealStartedRef.current = true;
      copyRevealCompleteRef.current = true;
      copyHoldCompleteRef.current = true;
      window.clearTimeout(copyHoldTimeoutRef.current);
      setCopyRevealDuration(0);
      setCopyRevealInstant(true);
      setCopyRevealed(true);
    };

    const settleAtIntroEnd = () => {
      if (!Number.isFinite(instance.video.duration)) return;

      const introEndTime = getIntroEndTime();
      if (instance.transitioningRaf) {
        window.cancelAnimationFrame(instance.transitioningRaf);
        instance.transitioningRaf = null;
      }
      instance.video.pause();
      instance.video.currentTime = introEndTime;
      instance.currentTime = introEndTime;
      instance.targetTime = introEndTime;
      instance.videoPercentage = introEndTime / instance.video.duration;
    };

    const releaseScrollGate = () => {
      if (!scrollGateActive) return;

      scrollGateActive = false;
      delete document.documentElement.dataset.heroIntroLocked;
      sequence.removeAttribute("data-lenis-prevent-wheel");
      sequence.removeAttribute("data-lenis-prevent-touch");
      window.removeEventListener("wheel", handleWheel, true);
      window.removeEventListener("touchstart", handleTouchStart, true);
      window.removeEventListener("touchmove", handleTouchMove, true);
      window.removeEventListener("touchend", handleTouchEnd, true);
      window.removeEventListener("touchcancel", handleTouchEnd, true);
      window.removeEventListener("keydown", handleScrollKey, true);
      window.removeEventListener("scroll", handleUnexpectedScroll);
    };

    const failOpen = () => {
      if (!active || sequencePhaseRef.current === HERO_SEQUENCE_PHASE.FALLBACK) {
        return;
      }

      window.clearTimeout(introWatchdogTimeout);
      window.clearTimeout(copyFallbackTimeout);
      window.cancelAnimationFrame(introFrame);
      introFrame = 0;
      if (instance.transitioningRaf) {
        window.cancelAnimationFrame(instance.transitioningRaf);
        instance.transitioningRaf = null;
      }
      instance.video.pause();
      showCopyInstantly();
      setPhase(HERO_SEQUENCE_PHASE.FALLBACK);
      releaseScrollGate();
      heroTimelineControllerRef.current?.showStatic();
      setEngineVideoReady(false);
      setVideoFailed(true);
    };

    const retryOrFailOpen = () => {
      if (!active || retryScheduled) return;

      if (videoLoadAttempt >= MASTER_VIDEO_MAX_RETRIES) {
        failOpen();
        return;
      }

      retryScheduled = true;
      window.clearTimeout(readyTimeout);
      window.clearTimeout(introWatchdogTimeout);
      window.clearTimeout(copyFallbackTimeout);
      window.cancelAnimationFrame(introFrame);
      introFrame = 0;
      if (instance.transitioningRaf) {
        window.cancelAnimationFrame(instance.transitioningRaf);
        instance.transitioningRaf = null;
      }
      instance.video.pause();
      releaseScrollGate();
      media?.removeAttribute("data-ready");
      setEngineVideoReady(false);

      retryTimeout = window.setTimeout(() => {
        if (active) setVideoLoadAttempt((attempt) => attempt + 1);
      }, MASTER_VIDEO_RETRY_DELAY);
    };

    const enterScrub = ({ force = false, jump = false } = {}) => {
      if (!active || sequencePhaseRef.current === HERO_SEQUENCE_PHASE.SCRUB) {
        return;
      }

      if (
        !force &&
        !canEnterScrub({
          phase: sequencePhaseRef.current,
          introMediaComplete: introMediaCompleteRef.current,
          copyHoldComplete: copyHoldCompleteRef.current,
        })
      ) {
        return;
      }

      window.clearTimeout(introWatchdogTimeout);
      window.clearTimeout(copyFallbackTimeout);
      settleAtIntroEnd();
      engineProgressRef.current = 0;
      setPhase(HERO_SEQUENCE_PHASE.SCRUB);
      heroTimelineControllerRef.current?.enable({ jump });
      releaseScrollGate();
    };

    enterScrubControllerRef.current = enterScrub;

    const enterScrubFromCurrentPosition = () => {
      showCopyInstantly();
      introMediaCompleteRef.current = true;
      enterScrub({ force: true, jump: true });
    };

    const finishIntroImmediately = () => {
      showCopyInstantly();
      introMediaCompleteRef.current = true;
      enterScrub({ force: true, jump: false });
    };

    const playIntro = () => {
      if (
        !active ||
        !ready ||
        sequencePhaseRef.current !== HERO_SEQUENCE_PHASE.INTRO ||
        introMediaCompleteRef.current
      ) {
        return;
      }

      instance.video.playbackRate = sequenceSpeedRef.current;
      instance.video.play().catch((error) => {
        // Pausing at the seam can reject an outstanding play promise. That is
        // an expected handoff, not a media failure. Autoplay denial can also
        // recover on the next wheel, touch, or keyboard gesture.
        if (
          active &&
          sequencePhaseRef.current === HERO_SEQUENCE_PHASE.INTRO &&
          !introMediaCompleteRef.current &&
          error?.name !== "AbortError" &&
          error?.name !== "NotAllowedError"
        ) {
          retryOrFailOpen();
        }
      });
      if (!introFrame) introFrame = window.requestAnimationFrame(trackIntro);
    };

    const accelerateIntro = (distance: number, timestamp: number) => {
      if (
        distance <= 0 ||
        sequencePhaseRef.current !== HERO_SEQUENCE_PHASE.INTRO
      ) {
        return;
      }

      const elapsed = lastInputTime
        ? Math.max(timestamp - lastInputTime, 16)
        : 16;
      lastInputTime = timestamp;
      const velocity = distance / (elapsed / 1000);
      const nextSpeed = Math.max(
        sequenceSpeedRef.current,
        getPlaybackSpeed(velocity),
      );
      sequenceSpeedRef.current = nextSpeed;
      instance.video.playbackRate = nextSpeed;
      playIntro();
    };

    function handleWheel(event: WheelEvent) {
      if (
        sequencePhaseRef.current !== HERO_SEQUENCE_PHASE.INTRO ||
        document.documentElement.dataset.contactOpen === "true"
      ) {
        return;
      }

      if (event.cancelable) event.preventDefault();
      const multiplier =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? 16
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? window.innerHeight
            : 1;
      accelerateIntro(event.deltaY * multiplier, event.timeStamp);
    }

    function handleTouchStart(event: TouchEvent) {
      if (sequencePhaseRef.current !== HERO_SEQUENCE_PHASE.INTRO) return;
      lastTouchY = event.touches[0]?.clientY ?? null;
      lastInputTime = event.timeStamp;
    }

    function handleTouchMove(event: TouchEvent) {
      if (
        sequencePhaseRef.current !== HERO_SEQUENCE_PHASE.INTRO ||
        document.documentElement.dataset.contactOpen === "true"
      ) {
        return;
      }

      if (event.cancelable) event.preventDefault();
      const nextTouchY = event.touches[0]?.clientY ?? lastTouchY;
      const distance = lastTouchY == null ? 0 : lastTouchY - nextTouchY;
      lastTouchY = nextTouchY;
      accelerateIntro(distance, event.timeStamp);
    }

    function handleTouchEnd() {
      lastTouchY = null;
      lastInputTime = 0;
    }

    function handleScrollKey(event: KeyboardEvent) {
      if (
        sequencePhaseRef.current !== HERO_SEQUENCE_PHASE.INTRO ||
        document.documentElement.dataset.contactOpen === "true" ||
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (
        target instanceof Element &&
        target.closest(
          "input, textarea, select, button, [contenteditable='true'], [data-lenis-prevent]",
        )
      ) {
        return;
      }

      const forwardKey =
        event.key === "ArrowDown" ||
        event.key === "PageDown" ||
        event.key === "End" ||
        (event.key === " " && !event.shiftKey);
      const backwardKey =
        event.key === "ArrowUp" ||
        event.key === "PageUp" ||
        event.key === "Home" ||
        (event.key === " " && event.shiftKey);

      if (forwardKey) {
        finishIntroImmediately();
      } else if (backwardKey && event.cancelable) {
        event.preventDefault();
      }
    }

    function handleUnexpectedScroll() {
      if (
        sequencePhaseRef.current === HERO_SEQUENCE_PHASE.INTRO &&
        Math.abs(window.scrollY - lockedScrollY) > LOCKED_SCROLL_TOLERANCE
      ) {
        enterScrubFromCurrentPosition();
      }
    }

    const installScrollGate = () => {
      if (scrollGateActive) return;

      scrollGateActive = true;
      lockedScrollY = window.scrollY;
      document.documentElement.dataset.heroIntroLocked = "true";
      sequence.setAttribute("data-lenis-prevent-wheel", "");
      sequence.setAttribute("data-lenis-prevent-touch", "");
      window.addEventListener("wheel", handleWheel, {
        capture: true,
        passive: false,
      });
      window.addEventListener("touchstart", handleTouchStart, {
        capture: true,
        passive: true,
      });
      window.addEventListener("touchmove", handleTouchMove, {
        capture: true,
        passive: false,
      });
      window.addEventListener("touchend", handleTouchEnd, {
        capture: true,
        passive: true,
      });
      window.addEventListener("touchcancel", handleTouchEnd, {
        capture: true,
        passive: true,
      });
      window.addEventListener("keydown", handleScrollKey, true);
      window.addEventListener("scroll", handleUnexpectedScroll, {
        passive: true,
      });
    };

    const syncHoodState = () => {
      if (!active || !Number.isFinite(instance.video.duration)) return;

      const introEndTime = getIntroEndTime();
      const engineDuration = instance.video.duration - introEndTime;
      const engineProgress =
        engineDuration > 0
          ? (instance.video.currentTime - introEndTime) / engineDuration
          : 0;
      const nextHoodOpen = engineProgress >= ENGINE_HOOD_OPEN_PROGRESS;

      if (nextHoodOpen === hoodOpen) return;
      hoodOpen = nextHoodOpen;
      if (nextHoodOpen) {
        setHoodRevealRate(sequenceSpeedRef.current);
      }
      setEngineHoodOpen(nextHoodOpen);
    };

    const finishIntroMedia = () => {
      if (introMediaCompleteRef.current) return;

      introMediaCompleteRef.current = true;
      settleAtIntroEnd();
      enterScrub();
    };

    const syncIntroProgress = () => {
      if (
        !active ||
        sequencePhaseRef.current !== HERO_SEQUENCE_PHASE.INTRO ||
        introMediaCompleteRef.current
      ) {
        return;
      }

      if (instance.video.currentTime >= COPY_REVEAL_TIME) {
        revealCopy(instance.video.playbackRate);
      }

      if (
        instance.video.currentTime >=
        getIntroEndTime() - SCROLLY_FRAME_THRESHOLD
      ) {
        finishIntroMedia();
      }
    };

    function trackIntro() {
      introFrame = 0;
      syncIntroProgress();
      if (
        !active ||
        sequencePhaseRef.current !== HERO_SEQUENCE_PHASE.INTRO ||
        introMediaCompleteRef.current
      ) return;

      introFrame = window.requestAnimationFrame(trackIntro);
    }

    const controlMasterProgress = (
      engineProgress: number,
      {
        jump = false,
        velocity = 0,
      }: { jump?: boolean; velocity?: number } = {},
    ) => {
      if (
        !active ||
        sequencePhaseRef.current !== HERO_SEQUENCE_PHASE.SCRUB ||
        !Number.isFinite(instance.video.duration)
      ) {
        return;
      }

      const masterPercentage = getMasterPercentage(engineProgress);
      const introEndTime = getIntroEndTime();
      const engineDuration = instance.video.duration - introEndTime;
      const currentEngineProgress = engineDuration > 0
        ? Math.max(
            0,
            (instance.video.currentTime - introEndTime) / engineDuration,
          )
        : 0;
      const progressDistance = Math.abs(engineProgress - currentEngineProgress);
      const transitionSpeed = Math.max(
        getPlaybackSpeed(Math.abs(velocity), SCROLLY_TRANSITION_SPEED),
        1 + progressDistance * (SCROLLY_TRANSITION_SPEED - 1),
      );
      sequenceSpeedRef.current = Math.min(
        INTRO_MAX_PLAYBACK_RATE,
        transitionSpeed,
      );

      // ScrollyVideo keeps an internal time mirror. Adopt the element's latest
      // decoded frame before asking the library to converge on a new target.
      instance.currentTime = instance.video.currentTime;
      instance.setVideoPercentage(masterPercentage, {
        jump,
        transitionSpeed,
      });
    };

    masterProgressControllerRef.current = controlMasterProgress;

    const startIntro = () => {
      setPhase(HERO_SEQUENCE_PHASE.INTRO);
      heroTimelineControllerRef.current?.disable();
      installScrollGate();
      copyFallbackTimeout = window.setTimeout(
        () => revealCopy(instance.video.playbackRate),
        COPY_REVEAL_TIME * 1000,
      );
      introWatchdogTimeout = window.setTimeout(
        retryOrFailOpen,
        ENGINE_VIDEO_READY_TIMEOUT,
      );
      playIntro();
    };

    const markReady = () => {
      if (!active || ready) return;
      if (
        instance.video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
        !Number.isFinite(instance.video.duration) ||
        instance.video.duration <= 0
      ) {
        return;
      }

      // ScrollyVideo calculates cover sizing before metadata is available.
      // Recalculate it while the video is still hidden, then reveal the frame.
      instance.resize();
      ready = true;
      window.clearTimeout(readyTimeout);
      media?.setAttribute("data-ready", "true");
      setEngineVideoReady(true);
      syncHoodState();
      const startedAwayFromHeroTop =
        Math.abs(window.scrollY) > LOCKED_SCROLL_TOLERANCE ||
        (window.location.hash && window.location.hash !== "#top");

      if (startedAwayFromHeroTop) {
        enterScrubFromCurrentPosition();
      } else {
        startIntro();
      }
    };

    const handleMetadata = () => {
      if (
        instance.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
        !instance.video.seeking
      ) {
        markReady();
      }
    };

    const handlePlayableFrame = () => {
      if (!instance.video.seeking) markReady();
    };

    const handleError = () => {
      retryOrFailOpen();
    };

    const handleReadyTimeout = () => {
      if (!ready) handleError();
    };

    instance.video.addEventListener("loadedmetadata", handleMetadata);
    instance.video.addEventListener("loadeddata", handlePlayableFrame);
    instance.video.addEventListener("canplay", handlePlayableFrame);
    const handleTimeUpdate = () => {
      if (sequencePhaseRef.current === HERO_SEQUENCE_PHASE.INTRO) {
        syncIntroProgress();
      } else {
        syncHoodState();
      }
    };

    instance.video.addEventListener("timeupdate", handleTimeUpdate);
    instance.video.addEventListener("seeking", syncHoodState);
    instance.video.addEventListener("seeked", markReady);
    instance.video.addEventListener("seeked", syncHoodState);
    instance.video.addEventListener("ended", syncHoodState);
    instance.video.addEventListener("error", handleError);

    readyTimeout = window.setTimeout(
      handleReadyTimeout,
      ENGINE_VIDEO_READY_TIMEOUT,
    );

    if (instance.video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      handleMetadata();
    }
    if (instance.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      handlePlayableFrame();
    }

    return () => {
      active = false;
      window.clearTimeout(readyTimeout);
      window.clearTimeout(retryTimeout);
      window.clearTimeout(introWatchdogTimeout);
      window.clearTimeout(copyFallbackTimeout);
      window.clearTimeout(copyHoldTimeoutRef.current);
      window.cancelAnimationFrame(introFrame);
      releaseScrollGate();
      instance.video.removeEventListener("loadedmetadata", handleMetadata);
      instance.video.removeEventListener("loadeddata", handlePlayableFrame);
      instance.video.removeEventListener("canplay", handlePlayableFrame);
      instance.video.removeEventListener("timeupdate", handleTimeUpdate);
      instance.video.removeEventListener("seeking", syncHoodState);
      instance.video.removeEventListener("seeked", markReady);
      instance.video.removeEventListener("seeked", syncHoodState);
      instance.video.removeEventListener("ended", syncHoodState);
      instance.video.removeEventListener("error", handleError);
      if (masterProgressControllerRef.current === controlMasterProgress) {
        masterProgressControllerRef.current = null;
      }
      if (enterScrubControllerRef.current === enterScrub) {
        enterScrubControllerRef.current = null;
      }
      if (instance.transitioningRaf) {
        window.cancelAnimationFrame(instance.transitioningRaf);
        instance.transitioningRaf = null;
      }
      instance.video.pause();
      instance.video.removeEventListener("progress", instance.resize);
      instance.destroy();
      instance.video.removeAttribute("src");
      instance.video.load();
      mount.remove();
    };
  }, [reduceMotion, revealCopy, videoFailed, videoLoadAttempt]);
}
