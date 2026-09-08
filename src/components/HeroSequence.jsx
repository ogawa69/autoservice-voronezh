import { useCallback, useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";
import ScrollyVideo from "scrolly-video/dist/ScrollyVideo.js";
import { ContactTrigger } from "./ContactDialog";
import AnimatedContent from "./AnimatedContent";
import VerticalCutReveal from "./fancy/text/vertical-cut-reveal";
import Typewriter from "./fancy/text/typewriter";
import {
  HERO_SEQUENCE_PHASE,
  canEnterScrub,
  getMasterTargetTime,
  resolveEngineProgress,
} from "./heroSequenceState";
import { InteractiveHoverButton } from "./ui/interactive-hover-button";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const COPY_REVEAL_TIME = 1.35;
const COPY_REVEAL_BASE_DURATION = 500;
const COPY_REVEAL_MIN_DURATION = 150;
const COPY_REVEAL_STAGGER = 360;
const COPY_REVEAL_MIN_STAGGER = 180;
const COPY_FULLY_VISIBLE_HOLD = 500;
const MASTER_INTRO_END_TIME = 5.041667;
const MASTER_VIDEO_SRC = "/hero/hero-master-scroll.mp4";
const MASTER_VIDEO_POSTER_SRC = "/hero/service-light-start-16x9-v3.png";
const INTRO_MAX_PLAYBACK_RATE = 4;
const SCROLL_VELOCITY_FOR_MAX_SPEED = 2400;
const ENGINE_VIDEO_START_PROGRESS = 0.18;
const ENGINE_VIDEO_END_PROGRESS = 0.94;
const ENGINE_HOOD_OPEN_PROGRESS = 0.985;
const HERO_COPY_EXIT_START_PROGRESS = 0.13;
const HERO_COPY_EXIT_DURATION =
  ENGINE_VIDEO_START_PROGRESS - HERO_COPY_EXIT_START_PROGRESS;
const HERO_NAV_EXIT_START_PROGRESS = 0.145;
const HERO_NAV_EXIT_DURATION =
  ENGINE_VIDEO_START_PROGRESS - HERO_NAV_EXIT_START_PROGRESS;
const SCROLLY_TRANSITION_SPEED = 10;
const SCROLLY_FRAME_THRESHOLD = 1 / 48;
const ENGINE_VIDEO_READY_TIMEOUT = 10000;
const MASTER_VIDEO_MAX_RETRIES = 1;
const MASTER_VIDEO_RETRY_DELAY = 500;
const LOCKED_SCROLL_TOLERANCE = 1;
const HERO_SCROLL_DISTANCE_VH = 280;
const HOOD_CTA_HOLD_DISTANCE_VH = 100;
const HOOD_CTA_TRIGGER_VIEWPORT_LINE = 66;
const HOOD_CTA_REVEAL_AT =
  ENGINE_VIDEO_START_PROGRESS +
  (ENGINE_VIDEO_END_PROGRESS - ENGINE_VIDEO_START_PROGRESS) *
    ENGINE_HOOD_OPEN_PROGRESS;
const HOOD_CTA_TRIGGER_TOP_VH =
  HOOD_CTA_TRIGGER_VIEWPORT_LINE +
  HERO_SCROLL_DISTANCE_VH * HOOD_CTA_REVEAL_AT;
const HOOD_CTA_DESCRIPTION =
  "Опишите симптомы — подберём время и скажем, с чего начать.";

const getPlaybackSpeed = (velocity, maximum = INTRO_MAX_PLAYBACK_RATE) => {
  const forwardVelocity = Math.max(0, velocity);
  const velocityProgress = Math.min(
    forwardVelocity / SCROLL_VELOCITY_FOR_MAX_SPEED,
    1,
  );

  return 1 + velocityProgress * (maximum - 1);
};

export function HeroSequence() {
  const sequenceRef = useRef(null);
  const animationEndRef = useRef(null);
  const heroNavRef = useRef(null);
  const heroCopyRef = useRef(null);
  const engineLayerRef = useRef(null);
  const masterMediaRef = useRef(null);
  const scrollyContainerRef = useRef(null);
  const masterProgressControllerRef = useRef(null);
  const heroTimelineControllerRef = useRef(null);
  const enterScrubControllerRef = useRef(null);
  const engineProgressRef = useRef(0);
  const sequencePhaseRef = useRef(HERO_SEQUENCE_PHASE.LOADING);
  const introMediaCompleteRef = useRef(false);
  const copyRevealStartedRef = useRef(false);
  const copyRevealCompleteRef = useRef(false);
  const copyHoldCompleteRef = useRef(false);
  const copyHoldTimeoutRef = useRef(0);
  const sequenceSpeedRef = useRef(1);
  const hoodTitleRef = useRef(null);
  const hoodActionRef = useRef(null);
  const hoodTriggerRef = useRef(null);
  const reduceMotion = Boolean(useReducedMotion());
  const [copyRevealed, setCopyRevealed] = useState(false);
  const [copyRevealDuration, setCopyRevealDuration] = useState(
    COPY_REVEAL_BASE_DURATION,
  );
  const [copyRevealInstant, setCopyRevealInstant] = useState(false);
  const [sequencePhase, setSequencePhase] = useState(
    HERO_SEQUENCE_PHASE.LOADING,
  );
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoLoadAttempt, setVideoLoadAttempt] = useState(0);
  const [engineVideoReady, setEngineVideoReady] = useState(false);
  const [engineHoodOpen, setEngineHoodOpen] = useState(false);
  const [hoodRevealRate, setHoodRevealRate] = useState(1);
  const [hoodCopyVisible, setHoodCopyVisible] = useState(false);
  const [hoodRevealCycle, setHoodRevealCycle] = useState(0);
  const introComplete = sequencePhase === HERO_SEQUENCE_PHASE.SCRUB;
  const copyVisible = reduceMotion || videoFailed || copyRevealed;
  const staticHoodContent = reduceMotion || videoFailed;
  const copyRevealDurationSeconds = copyRevealInstant
    ? 0
    : copyRevealDuration / 1000;
  const copyRevealStaggerSeconds =
    copyRevealInstant
      ? 0
      : Math.max(
          COPY_REVEAL_MIN_STAGGER,
          Math.round(
            (copyRevealDuration / COPY_REVEAL_BASE_DURATION) *
              COPY_REVEAL_STAGGER,
          ),
        ) / 1000;

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
    let lastTouchY = null;

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

    const getMasterPercentage = (engineProgress) => {
      const introEndTime = getIntroEndTime();
      const targetTime = getMasterTargetTime({
        duration: instance.video.duration,
        introEndTime,
        engineProgress,
      });

      return targetTime / instance.video.duration;
    };

    const setPhase = (nextPhase) => {
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

    const accelerateIntro = (distance, timestamp) => {
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

    function handleWheel(event) {
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

    function handleTouchStart(event) {
      if (sequencePhaseRef.current !== HERO_SEQUENCE_PHASE.INTRO) return;
      lastTouchY = event.touches[0]?.clientY ?? null;
      lastInputTime = event.timeStamp;
    }

    function handleTouchMove(event) {
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

    function handleScrollKey(event) {
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
      engineProgress,
      { jump = false, velocity = 0 } = {},
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

  useGSAP(
    () => {
      const sequence = sequenceRef.current;
      const nav = heroNavRef.current;
      const copy = heroCopyRef.current;
      const engineLayer = engineLayerRef.current;
      const animationEnd = animationEndRef.current;

      if (
        !sequence ||
        !nav ||
        !copy ||
        !engineLayer ||
        !animationEnd ||
        reduceMotion ||
        videoFailed
      ) {
        return undefined;
      }

      let syncRaf = 0;
      let pendingProgress = 0;
      let pendingVelocity = 0;
      let latestVelocity = 0;
      let refreshShouldJump = false;

      const applyEngineProgress = () => {
        syncRaf = 0;
        if (sequencePhaseRef.current !== HERO_SEQUENCE_PHASE.SCRUB) return;
        engineProgressRef.current = pendingProgress;
        masterProgressControllerRef.current?.(pendingProgress, {
          velocity: pendingVelocity,
        });
      };

      const syncEngineProgress = (
        scrollProgress,
        jump = false,
        velocity = 0,
      ) => {
        const videoProgress = resolveEngineProgress({
          phase: sequencePhaseRef.current,
          previousProgress: engineProgressRef.current,
          scrollProgress,
          startProgress: ENGINE_VIDEO_START_PROGRESS,
          endProgress: ENGINE_VIDEO_END_PROGRESS,
        });

        if (sequencePhaseRef.current !== HERO_SEQUENCE_PHASE.SCRUB) return;

        if (jump) {
          window.cancelAnimationFrame(syncRaf);
          syncRaf = 0;
          engineProgressRef.current = videoProgress;
          masterProgressControllerRef.current?.(videoProgress, {
            jump: true,
            velocity,
          });
          return;
        }

        pendingProgress = videoProgress;
        pendingVelocity = velocity;
        if (!syncRaf) syncRaf = window.requestAnimationFrame(applyEngineProgress);
      };

      const timelineProgress = { value: 0 };

      const timeline = gsap.timeline({
        onUpdate: () =>
          syncEngineProgress(
            timelineProgress.value,
            false,
            latestVelocity,
          ),
        scrollTrigger: {
          trigger: sequence,
          start: "top top",
          endTrigger: animationEnd,
          end: "top top",
          scrub: 0.18,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            latestVelocity = self.getVelocity();
          },
          onRefresh: (self) =>
            syncEngineProgress(
              self.progress,
              refreshShouldJump,
              self.getVelocity(),
            ),
        },
      });

      timeline.to(
        timelineProgress,
        {
          value: 1,
          duration: 1,
          ease: "none",
        },
        0,
      );

      timeline
        .to(
          copy,
          {
            autoAlpha: 0,
            clipPath: "inset(100% 0% 0% 0%)",
            duration: HERO_COPY_EXIT_DURATION,
            ease: "power2.inOut",
          },
          HERO_COPY_EXIT_START_PROGRESS,
        )
        .to(
          nav,
          {
            autoAlpha: 0,
            duration: HERO_NAV_EXIT_DURATION,
            ease: "power3.out",
          },
          HERO_NAV_EXIT_START_PROGRESS,
        )
        .set(engineLayer, { autoAlpha: 1 }, ENGINE_VIDEO_START_PROGRESS);

      const timelineController = {
        disable: () => {
          timeline.scrollTrigger?.disable(false);
          timeline.progress(0).pause();
          engineProgressRef.current = 0;
        },
        enable: ({ jump = false } = {}) => {
          refreshShouldJump = jump;
          timeline.scrollTrigger?.enable(false, true);
          refreshShouldJump = false;
        },
        showStatic: () => {
          timeline.scrollTrigger?.disable(false);
          timeline.progress(0).pause();
          gsap.set(nav, { clearProps: "opacity,visibility" });
          gsap.set(copy, {
            clearProps: "opacity,visibility,clipPath",
          });
          gsap.set(engineLayer, { clearProps: "opacity,visibility" });
        },
      };

      heroTimelineControllerRef.current = timelineController;
      if (sequencePhaseRef.current === HERO_SEQUENCE_PHASE.SCRUB) {
        timelineController.enable({ jump: true });
      } else {
        timelineController.disable();
      }

      return () => {
        window.cancelAnimationFrame(syncRaf);
        if (heroTimelineControllerRef.current === timelineController) {
          heroTimelineControllerRef.current = null;
        }
        timeline?.kill();
      };
    },
    {
      scope: sequenceRef,
      dependencies: [reduceMotion, videoFailed],
      revertOnUpdate: true,
    },
  );

  useGSAP(
    () => {
      const action = hoodActionRef.current;
      const trigger = hoodTriggerRef.current;

      if (!action || !trigger) return undefined;

      if (reduceMotion || videoFailed) {
        setHoodCopyVisible(true);
        gsap.set(action, { clearProps: "all" });
        return undefined;
      }

      if (!engineVideoReady || !engineHoodOpen) {
        hoodTitleRef.current?.reset();
        setHoodCopyVisible(false);
        gsap.set(action, { autoAlpha: 0, y: 14 });
        return undefined;
      }

      let revealFrame = 0;
      let revealed = false;
      const actionDuration = Math.max(0.18, 0.42 / hoodRevealRate);
      const actionDelay = 0.68 / hoodRevealRate;

      const revealContent = () => {
        if (revealed) return;
        revealed = true;
        hoodTitleRef.current?.reset();
        setHoodRevealCycle((cycle) => cycle + 1);
        setHoodCopyVisible(true);
        window.cancelAnimationFrame(revealFrame);
        revealFrame = window.requestAnimationFrame(() =>
          hoodTitleRef.current?.startAnimation(),
        );

        gsap.fromTo(
          action,
          { autoAlpha: 0, y: 14 },
          {
            autoAlpha: 1,
            y: 0,
            duration: actionDuration,
            delay: actionDelay,
            ease: "power3.out",
            overwrite: true,
          },
        );
      };

      const resetContent = () => {
        revealed = false;
        window.cancelAnimationFrame(revealFrame);
        hoodTitleRef.current?.reset();
        setHoodCopyVisible(false);
        gsap.set(action, { autoAlpha: 0, y: 14 });
      };

      resetContent();

      const contentTrigger = ScrollTrigger.create({
        trigger,
        start: "top 66%",
        onEnter: revealContent,
        onEnterBack: revealContent,
        onLeaveBack: resetContent,
      });

      // If loading finished after the visitor had already crossed the trigger,
      // reveal against the current scroll position instead of waiting for more scroll.
      if (contentTrigger.scroll() >= contentTrigger.start) revealContent();

      return () => {
        window.cancelAnimationFrame(revealFrame);
        contentTrigger.kill();
      };
    },
    {
      scope: sequenceRef,
      dependencies: [
        reduceMotion,
        videoFailed,
        engineVideoReady,
        engineHoodOpen,
        hoodRevealRate,
      ],
      revertOnUpdate: true,
    },
  );

  return (
    <div
      ref={sequenceRef}
      className="hero-scroll-sequence"
      data-hood-static={staticHoodContent}
      data-reduced-motion={reduceMotion}
      data-video-failed={videoFailed}
      data-engine-video-ready={engineVideoReady || staticHoodContent}
      data-intro-complete={introComplete || staticHoodContent}
      data-sequence-phase={
        staticHoodContent ? HERO_SEQUENCE_PHASE.FALLBACK : sequencePhase
      }
      style={{
        "--hero-animation-scroll-distance": `${HERO_SCROLL_DISTANCE_VH}svh`,
        "--hood-cta-hold-distance": `${HOOD_CTA_HOLD_DISTANCE_VH}svh`,
      }}
    >
      <span
        ref={animationEndRef}
        className="hero-animation-end"
        aria-hidden="true"
      />
      <span
        ref={hoodTriggerRef}
        className="hood-cta-trigger"
        style={{ "--hood-cta-trigger-top": `${HOOD_CTA_TRIGGER_TOP_VH}svh` }}
        aria-hidden="true"
      />
      <div className="hero-sequence-stage">
        <section
          className="hero relative grid min-w-0"
          data-copy-visible={copyVisible}
          aria-labelledby="hero-title"
        >
          <div
            ref={masterMediaRef}
            className="hero-media"
            aria-hidden="true"
          >
            <picture className="hero-video-fallback">
              <source
                media="(max-width: 47.999rem)"
                srcSet={
                  reduceMotion
                    ? "/hero/mobile-light-portrait.png"
                    : MASTER_VIDEO_POSTER_SRC
                }
              />
              <img
                className="hero-image"
                src={reduceMotion ? "/hero/light.png" : MASTER_VIDEO_POSTER_SRC}
                width={reduceMotion ? 1448 : 1920}
                height={reduceMotion ? 1086 : 1080}
                fetchPriority="high"
                alt=""
              />
            </picture>

            {!reduceMotion && !videoFailed && (
              <div ref={scrollyContainerRef} data-scrolly-container />
            )}
          </div>

          <nav
            ref={heroNavRef}
            className="hero-nav flex items-center justify-between"
            aria-label="Главная навигация"
          >
            <AnimatedContent
              active={copyVisible}
              as="a"
              className="wordmark hero-wordmark-reveal"
              distance={16}
              duration={copyRevealDurationSeconds}
              delay={0}
              href="#top"
              aria-label="Автосервис — в начало страницы"
            >
              АВТОСЕРВИС<span aria-hidden="true">/01</span>
            </AnimatedContent>
            <ContactTrigger className="nav-contact" id="hero-contact-trigger">
              Связаться
            </ContactTrigger>
          </nav>

          <div ref={heroCopyRef} className="hero-copy min-w-0">
            <AnimatedContent
              active={copyVisible}
              as="h1"
              className="hero-title-reveal"
              direction="horizontal"
              reverse
              distance={24}
              duration={copyRevealDurationSeconds}
              delay={copyRevealStaggerSeconds}
              id="hero-title"
            >
              Видим то,
              <br />
              что скрыто.
            </AnimatedContent>
            <AnimatedContent
              active={copyVisible}
              className="hero-meta hero-meta-reveal"
              direction="horizontal"
              distance={24}
              duration={copyRevealDurationSeconds}
              delay={copyRevealStaggerSeconds * 2}
              onComplete={handleHeroCopyRevealComplete}
            >
              <p>Диагностика, обслуживание и ремонт · Воронеж, проспект Революции, 9.</p>
            </AnimatedContent>
          </div>
        </section>

        <section
          ref={engineLayerRef}
          className="hero-engine-layer"
          aria-labelledby="scroll-service-title"
        >
          {staticHoodContent && (
            <div className="scroll-video-media" aria-hidden="true">
              <img
                className="scroll-video-poster"
                src="/hero/engine-reveal-poster.jpg"
                width="1080"
                height="1916"
                loading="eager"
                alt=""
              />
            </div>
          )}

          <div className="hood-cta">
            <h2 id="scroll-service-title" className="hood-cta-title">
              {staticHoodContent ? (
                "Начнём с точной диагностики"
              ) : (
                <VerticalCutReveal
                  ref={hoodTitleRef}
                  autoStart={false}
                  splitBy="words"
                  staggerDuration={0.075 / hoodRevealRate}
                  staggerFrom="first"
                  transition={{
                    type: "spring",
                    duration: Math.max(0.2, 0.5 / hoodRevealRate),
                    bounce: 0.2,
                  }}
                  containerClassName="hood-cta-title-reveal"
                >
                  Начнём с точной диагностики
                </VerticalCutReveal>
              )}
            </h2>

            <div className="hood-cta-description">
              {staticHoodContent ? (
                <p>{HOOD_CTA_DESCRIPTION}</p>
              ) : hoodCopyVisible ? (
                <Typewriter
                  key={hoodRevealCycle}
                  as="p"
                  text={HOOD_CTA_DESCRIPTION}
                  speed={Math.max(8, Math.round(24 / hoodRevealRate))}
                  initialDelay={Math.max(
                    60,
                    Math.round(180 / hoodRevealRate),
                  )}
                  loop={false}
                  showCursor={false}
                />
              ) : (
                <p className="hood-cta-description-placeholder" aria-hidden="true">
                  {HOOD_CTA_DESCRIPTION}
                </p>
              )}
            </div>

            <div ref={hoodActionRef} className="hood-cta-action">
              <InteractiveHoverButton
                as={ContactTrigger}
                className="hood-contact-button"
                id="scroll-service-contact-trigger"
              >
                Связаться
              </InteractiveHoverButton>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
