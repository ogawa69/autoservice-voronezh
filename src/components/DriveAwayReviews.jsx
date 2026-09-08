import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Pause, Play, Star } from "lucide-react";
import { useReducedMotion } from "motion/react";
import ScrollyVideo from "scrolly-video/dist/ScrollyVideo.js";
import SimpleMarquee from "@/components/fancy/blocks/simple-marquee";
import VerticalCutReveal from "@/components/fancy/text/vertical-cut-reveal";
import { ContactSection } from "./ContactSection";
import {
  getDriveAwaySeekTarget,
  getDriveAwayTargetTime,
} from "./driveAwayVideoState";
import { reviewExamples } from "../data/siteContent";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const VIDEO_SOURCE = "/hero/drive-away-reviews.mp4";
const VIDEO_START_POSTER = "/hero/drive-away-reviews-poster.jpg";
const VIDEO_EMPTY_POSTER = "/hero/drive-away-reviews-empty.jpg";
const VIDEO_START_SECONDS = 4.15;
const VIDEO_END_SECONDS = 10;
const VIDEO_SCROLL_END = 0.58;
const REVIEW_HEADING_START = 0.22;
const REVIEW_TITLE_RESET_AT = 0.2;
const REVIEW_FIRST_ROW_START = 0.34;
const REVIEW_SECOND_ROW_START = 0.46;
const REVIEW_ROW_REVEAL_DURATION = 0.045;
const REVIEW_EXIT_START = 0.59;
const REVIEW_TITLE_EXIT_DURATION = 0.026;
const REVIEW_EXIT_STAGGER = 0.004;
const REVIEW_ROW_EXIT_DURATION = 0.028;
const REVIEW_TITLE_EXIT_START = REVIEW_EXIT_START;
const REVIEW_TITLE_EXIT_END =
  REVIEW_TITLE_EXIT_START + REVIEW_TITLE_EXIT_DURATION;
const REVIEW_FIRST_ROW_EXIT_START =
  REVIEW_TITLE_EXIT_END + REVIEW_EXIT_STAGGER;
const REVIEW_SECOND_ROW_EXIT_START =
  REVIEW_FIRST_ROW_EXIT_START + REVIEW_ROW_EXIT_DURATION + REVIEW_EXIT_STAGGER;
const REVIEW_ROWS_EXIT_END =
  REVIEW_SECOND_ROW_EXIT_START + REVIEW_ROW_EXIT_DURATION;
const REVIEW_EXIT_END = REVIEW_ROWS_EXIT_END;
const CONTACT_REVEAL_START = 0.69;
const CONTACT_HEADING_START = 0.7;
const CONTACT_TITLE_RESET_AT = 0.685;
const CONTACT_PHONE_START = 0.74;
const CONTACT_HOURS_START = 0.79;
const CONTACT_ADDRESS_START = 0.84;
const CONTACT_MAP_START = 0.89;
const CONTACT_ITEM_DURATION = 0.045;
const CONTACT_MAP_DURATION = 0.07;
const CONTACT_CONTENT_START = CONTACT_PHONE_START;
const REVIEW_MOTION_START = REVIEW_FIRST_ROW_START - 0.015;
const REVIEW_MOTION_END = REVIEW_ROWS_EXIT_END;
const FRAME_THRESHOLD = 1 / 48;
const VIDEO_MAX_RETRIES = 1;
const VIDEO_RETRY_DELAY = 500;
const CONTACT_MAP_DESKTOP_MEDIA_QUERY = "(min-width: 60rem)";
const DESKTOP_CONTACT_ENTRY_STEP =
  CONTACT_ITEM_DURATION + REVIEW_EXIT_STAGGER;
const DESKTOP_CONTACT_HEADING_START = CONTACT_HEADING_START;
const DESKTOP_CONTACT_HOURS_START =
  DESKTOP_CONTACT_HEADING_START + DESKTOP_CONTACT_ENTRY_STEP;
const DESKTOP_CONTACT_PHONE_START =
  DESKTOP_CONTACT_HOURS_START + DESKTOP_CONTACT_ENTRY_STEP;
const DESKTOP_CONTACT_ADDRESS_START =
  DESKTOP_CONTACT_PHONE_START + DESKTOP_CONTACT_ENTRY_STEP;
const DESKTOP_CONTACT_MAP_START =
  DESKTOP_CONTACT_ADDRESS_START + DESKTOP_CONTACT_ENTRY_STEP;

function useDesktopContactMapMotion() {
  const [desktop, setDesktop] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia(CONTACT_MAP_DESKTOP_MEDIA_QUERY).matches,
  );

  useEffect(() => {
    const media = window.matchMedia(CONTACT_MAP_DESKTOP_MEDIA_QUERY);
    const sync = () => setDesktop(media.matches);

    sync();
    media.addEventListener("change", sync);

    return () => media.removeEventListener("change", sync);
  }, []);

  return desktop;
}

function ReviewStars() {
  return (
    <span className="drive-review-stars" aria-label="Оценка: 5 из 5">
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          aria-hidden="true"
          size={17}
          strokeWidth={1.75}
          fill="currentColor"
        />
      ))}
    </span>
  );
}

function ReviewCard({ review }) {
  return (
    <article className="drive-review-card">
      <header className="drive-review-card__header">
        <span className="drive-review-card__avatar" aria-hidden="true">
          {review.author.slice(0, 1)}
        </span>
        <strong>{review.author}</strong>
        <ReviewStars />
      </header>
      <p className="drive-review-card__text">{review.text}</p>
    </article>
  );
}

function ReviewSet({ reviews }) {
  return (
    <div className="drive-review-set">
      {reviews.map((review) => (
        <ReviewCard key={`${review.author}-${review.car}`} review={review} />
      ))}
    </div>
  );
}

function MovingReviews({ active, firstRowRef, secondRowRef }) {
  const splitIndex = Math.ceil(reviewExamples.length / 2);
  const rows = [
    reviewExamples.slice(0, splitIndex),
    reviewExamples.slice(splitIndex),
  ];

  return (
    <div className="drive-review-rows">
      <div ref={firstRowRef} className="drive-review-row">
        <SimpleMarquee
          direction="left"
          baseVelocity={2.4}
          repeat={4}
          useScrollVelocity
          active={active}
          slowdownOnHover
          slowDownFactor={0}
        >
          <ReviewSet reviews={rows[0]} />
        </SimpleMarquee>
      </div>
      <div ref={secondRowRef} className="drive-review-row drive-review-row--reverse">
        <SimpleMarquee
          direction="right"
          baseVelocity={2.1}
          repeat={4}
          useScrollVelocity
          active={active}
          slowdownOnHover
          slowDownFactor={0}
        >
          <ReviewSet reviews={rows[1]} />
        </SimpleMarquee>
      </div>
    </div>
  );
}

function StaticReviews() {
  return (
    <div className="drive-review-static-grid">
      {reviewExamples.map((review) => (
        <ReviewCard key={`${review.author}-${review.car}`} review={review} />
      ))}
    </div>
  );
}

export function DriveAwayReviews() {
  const sectionRef = useRef(null);
  const mediaMountRef = useRef(null);
  const reviewsRef = useRef(null);
  const reviewsHeaderRef = useRef(null);
  const reviewsHeadingCopyRef = useRef(null);
  const reviewsTitleRef = useRef(null);
  const reviewsTitleStartedRef = useRef(false);
  const firstReviewRowRef = useRef(null);
  const secondReviewRowRef = useRef(null);
  const motionToggleRef = useRef(null);
  const contactRef = useRef(null);
  const contactTitleRef = useRef(null);
  const contactTitleStartedRef = useRef(false);
  const videoControllerRef = useRef(null);
  const storyProgressRef = useRef(0);
  const contactActiveRef = useRef(false);
  const reviewMotionActiveRef = useRef(false);
  const reduceMotion = Boolean(useReducedMotion());
  const desktopContactMapMotion = useDesktopContactMapMotion();
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoLoadAttempt, setVideoLoadAttempt] = useState(0);
  const [contactActive, setContactActive] = useState(false);
  const [reviewMotionActive, setReviewMotionActive] = useState(false);
  const [marqueePaused, setMarqueePaused] = useState(false);

  useEffect(() => {
    const container = mediaMountRef.current;
    if (!container || reduceMotion || videoFailed) return undefined;

    let active = true;
    let ready = false;
    let initialFrameReady = false;
    let driveRaf = null;
    let retryTimeout = 0;
    let retryScheduled = false;
    let targetSeconds = VIDEO_START_SECONDS;

    const mount = document.createElement("div");
    mount.setAttribute("data-drive-away-mount", "");
    container.replaceChildren(mount);

    const instance = new ScrollyVideo({
      src: VIDEO_SOURCE,
      scrollyVideoContainer: mount,
      cover: true,
      sticky: false,
      full: false,
      trackScroll: false,
      lockScroll: false,
      frameThreshold: FRAME_THRESHOLD,
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
        frameThreshold: FRAME_THRESHOLD,
        seeking: video.seeking,
      });

      video.pause();
      video.playbackRate = 1;
      instance.currentTime = video.currentTime;
      instance.targetTime = targetSeconds;

      if (seekTarget === null) return;

      video.currentTime = seekTarget;
    };

    const syncVideo = (storyProgress) => {
      if (!active || !ready || !Number.isFinite(instance.video.duration)) {
        return;
      }

      targetSeconds = getDriveAwayTargetTime({
        storyProgress,
        duration: instance.video.duration,
        startSeconds: VIDEO_START_SECONDS,
        endSeconds: VIDEO_END_SECONDS,
        scrollEnd: VIDEO_SCROLL_END,
        frameRate: 24,
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
        Math.abs(instance.video.currentTime - targetSeconds) > FRAME_THRESHOLD
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
      videoControllerRef.current = syncVideo;
      instance.video.addEventListener("seeked", revealVideo);
      syncVideo(storyProgressRef.current);
    };

    const handleError = () => {
      if (!active || retryScheduled) return;
      setVideoReady(false);

      if (videoLoadAttempt >= VIDEO_MAX_RETRIES) {
        setVideoFailed(true);
        return;
      }

      retryScheduled = true;
      retryTimeout = window.setTimeout(() => {
        if (active) setVideoLoadAttempt((attempt) => attempt + 1);
      }, VIDEO_RETRY_DELAY);
    };

    instance.video.addEventListener("loadedmetadata", markReady);
    instance.video.addEventListener("loadeddata", markReady);
    instance.video.addEventListener("canplay", markReady);
    instance.video.addEventListener("seeked", handleSeeked);
    instance.video.addEventListener("error", handleError);

    if (instance.video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      markReady();
    }

    return () => {
      active = false;
      window.clearTimeout(retryTimeout);
      instance.video.removeEventListener("loadedmetadata", markReady);
      instance.video.removeEventListener("loadeddata", markReady);
      instance.video.removeEventListener("canplay", markReady);
      instance.video.removeEventListener("seeked", handleSeeked);
      instance.video.removeEventListener("error", handleError);
      instance.video.removeEventListener("seeked", revealVideo);
      if (videoControllerRef.current === syncVideo) {
        videoControllerRef.current = null;
      }
      if (instance.transitioningRaf) {
        cancelAnimationFrame(instance.transitioningRaf);
        instance.transitioningRaf = null;
      }
      if (driveRaf !== null) {
        cancelAnimationFrame(driveRaf);
        driveRaf = null;
      }
      instance.destroy();
      instance.video.pause();
      instance.video.removeAttribute("src");
      instance.video.load();
      mount.remove();
    };
  }, [reduceMotion, videoFailed, videoLoadAttempt]);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const reviews = reviewsRef.current;
      const reviewsHeader = reviewsHeaderRef.current;
      const reviewsHeadingCopy = reviewsHeadingCopyRef.current;
      const firstReviewRow = firstReviewRowRef.current;
      const secondReviewRow = secondReviewRowRef.current;
      const motionToggle = motionToggleRef.current;
      const contact = contactRef.current;
      const contactHeading = contact?.querySelector(".contact-story__heading");
      const contactPhone = contact?.querySelector('[data-contact-item="phone"]');
      const contactHours = contact?.querySelector('[data-contact-item="hours"]');
      const contactAddress = contact?.querySelector('[data-contact-item="address"]');
      const contactMap = contact?.querySelector("[data-contact-map]");
      if (
        !section ||
        !reviews ||
        !reviewsHeader ||
        !reviewsHeadingCopy ||
        !contact ||
        (!reduceMotion &&
          (!firstReviewRow ||
            !secondReviewRow ||
            !motionToggle ||
            (desktopContactMapMotion && !contactHeading) ||
            !contactPhone ||
            !contactHours ||
            !contactAddress ||
            !contactMap))
      ) {
        return undefined;
      }

      const updateContactPhase = (active) => {
        if (contactActiveRef.current === active) return;
        contactActiveRef.current = active;
        setContactActive(active);
      };
      const updateReviewMotionPhase = (active) => {
        if (reviewMotionActiveRef.current === active) return;
        reviewMotionActiveRef.current = active;
        setReviewMotionActive(active);
      };
      const contactContentStart = desktopContactMapMotion
        ? DESKTOP_CONTACT_HOURS_START
        : CONTACT_CONTENT_START;
      const shouldShowContactContent = (progress) =>
        contactActiveRef.current
          ? progress > CONTACT_REVEAL_START
          : progress >= contactContentStart;
      let titleRevealFrame = 0;
      let contactTitleRevealFrame = 0;
      const syncReviewsTitle = (progress) => {
        const title = reviewsTitleRef.current;
        if (!title) return;

        if (
          progress >= REVIEW_HEADING_START &&
          !reviewsTitleStartedRef.current
        ) {
          reviewsTitleStartedRef.current = true;
          title.reset();
          window.cancelAnimationFrame(titleRevealFrame);
          titleRevealFrame = window.requestAnimationFrame(() =>
            title.startAnimation(),
          );
        } else if (
          progress < REVIEW_TITLE_RESET_AT &&
          reviewsTitleStartedRef.current
        ) {
          reviewsTitleStartedRef.current = false;
          window.cancelAnimationFrame(titleRevealFrame);
          title.reset();
        }
      };
      const syncContactTitle = (progress) => {
        const title = contactTitleRef.current;
        if (!title) return;

        if (
          progress >= CONTACT_HEADING_START &&
          !contactTitleStartedRef.current
        ) {
          contactTitleStartedRef.current = true;
          title.reset();
          window.cancelAnimationFrame(contactTitleRevealFrame);
          contactTitleRevealFrame = window.requestAnimationFrame(() =>
            title.startAnimation(),
          );
        } else if (
          progress < CONTACT_TITLE_RESET_AT &&
          contactTitleStartedRef.current
        ) {
          contactTitleStartedRef.current = false;
          window.cancelAnimationFrame(contactTitleRevealFrame);
          title.reset();
        }
      };

      if (reduceMotion) {
        reviewsTitleStartedRef.current = false;
        contactTitleStartedRef.current = false;
        gsap.set(
          [
            reviews,
            reviewsHeader,
            reviewsHeadingCopy,
            firstReviewRow,
            secondReviewRow,
            motionToggle,
            contact,
            contactHeading,
            contactPhone,
            contactHours,
            contactAddress,
            contactMap,
          ].filter(Boolean),
          { clearProps: "all" },
        );
        updateContactPhase(true);
        updateReviewMotionPhase(false);
        return undefined;
      }

      updateContactPhase(false);
      updateReviewMotionPhase(false);
      const playhead = { progress: 0 };
      gsap.set(reviews, {
        autoAlpha: 1,
        clipPath: "inset(0% 0% 0% 0%)",
        pointerEvents: "auto",
        transform: "translateY(0rem)",
      });
      gsap.set(reviewsHeader, { autoAlpha: 1 });
      gsap.set(reviewsHeadingCopy, {
        autoAlpha: 1,
        transform: "translateX(0vw)",
      });
      gsap.set(motionToggle, {
        autoAlpha: 0,
        transform: "translateY(0.5rem)",
      });
      gsap.set([firstReviewRow, secondReviewRow], {
        autoAlpha: 0,
        clipPath: "inset(0% 0% 100% 0%)",
        transform: "translateY(1.5rem)",
      });
      gsap.set(contact, {
        autoAlpha: 0,
        clipPath: "inset(0% 0% 0% 0%)",
        pointerEvents: "none",
        transform: "translateY(0rem)",
      });
      if (desktopContactMapMotion) {
        gsap.set(contactHeading, {
          autoAlpha: 0,
          transform: "translate3d(-12vw, 0, 0)",
        });
      }
      gsap.set([contactPhone, contactAddress], {
        autoAlpha: 0,
        transform: "translate3d(-12vw, 0, 0)",
      });
      gsap.set(contactHours, {
        autoAlpha: 0,
        transform: desktopContactMapMotion
          ? "translate3d(-12vw, 0, 0)"
          : "translate3d(12vw, 0, 0)",
      });
      gsap.set(contactMap, {
        autoAlpha: 0,
        transform: desktopContactMapMotion
          ? "translate3d(12vw, 0, 0)"
          : "translate3d(0, 12svh, 0)",
      });

      const contactPhoneStart = desktopContactMapMotion
        ? DESKTOP_CONTACT_PHONE_START
        : CONTACT_PHONE_START;
      const contactHoursStart = desktopContactMapMotion
        ? DESKTOP_CONTACT_HOURS_START
        : CONTACT_HOURS_START;
      const contactAddressStart = desktopContactMapMotion
        ? DESKTOP_CONTACT_ADDRESS_START
        : CONTACT_ADDRESS_START;
      const contactMapStart = desktopContactMapMotion
        ? DESKTOP_CONTACT_MAP_START
        : CONTACT_MAP_START;
      const contactMapDuration = desktopContactMapMotion
        ? CONTACT_ITEM_DURATION
        : CONTACT_MAP_DURATION;

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.18,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            storyProgressRef.current = self.progress;
            videoControllerRef.current?.(self.progress);
            syncReviewsTitle(self.progress);
            syncContactTitle(self.progress);
            updateContactPhase(shouldShowContactContent(self.progress));
            updateReviewMotionPhase(
              self.progress >= REVIEW_MOTION_START &&
                self.progress <= REVIEW_MOTION_END,
            );
          },
          onRefresh: (self) => {
            storyProgressRef.current = self.progress;
            videoControllerRef.current?.(self.progress);
            syncReviewsTitle(self.progress);
            syncContactTitle(self.progress);
            updateContactPhase(shouldShowContactContent(self.progress));
            updateReviewMotionPhase(
              self.progress >= REVIEW_MOTION_START &&
                self.progress <= REVIEW_MOTION_END,
            );
          },
        },
      });

      if (desktopContactMapMotion) {
        timeline.to(
          contactHeading,
          {
            autoAlpha: 1,
            transform: "translate3d(0, 0, 0)",
            duration: CONTACT_ITEM_DURATION,
            ease: "none",
          },
          DESKTOP_CONTACT_HEADING_START,
        );
      }

      timeline
        .to(playhead, { progress: 1, duration: 1, ease: "none" }, 0)
        .to(
          firstReviewRow,
          {
            autoAlpha: 1,
            clipPath: "inset(0% 0% 0% 0%)",
            transform: "translateY(0rem)",
            duration: REVIEW_ROW_REVEAL_DURATION,
            ease: "power2.inOut",
          },
          REVIEW_FIRST_ROW_START,
        )
        .to(
          motionToggle,
          {
            autoAlpha: 1,
            transform: "translateY(0rem)",
            duration: REVIEW_ROW_REVEAL_DURATION,
            ease: "power2.out",
          },
          REVIEW_FIRST_ROW_START,
        )
        .to(
          secondReviewRow,
          {
            autoAlpha: 1,
            clipPath: "inset(0% 0% 0% 0%)",
            transform: "translateY(0rem)",
            duration: REVIEW_ROW_REVEAL_DURATION,
            ease: "power2.inOut",
          },
          REVIEW_SECOND_ROW_START,
        )
        .to(
          reviewsHeadingCopy,
          {
            autoAlpha: 0,
            transform: "translateX(12vw)",
            duration: REVIEW_TITLE_EXIT_DURATION,
            ease: "none",
          },
          REVIEW_TITLE_EXIT_START,
        )
        .to(
          motionToggle,
          {
            autoAlpha: 0,
            pointerEvents: "none",
            duration: REVIEW_TITLE_EXIT_DURATION,
            ease: "none",
          },
          REVIEW_EXIT_START,
        )
        .to(
          firstReviewRow,
          {
            autoAlpha: 0,
            clipPath: "inset(100% 0% 0% 0%)",
            transform: "translateY(1.5rem)",
            duration: REVIEW_ROW_EXIT_DURATION,
            ease: "none",
          },
          REVIEW_FIRST_ROW_EXIT_START,
        )
        .to(
          secondReviewRow,
          {
            autoAlpha: 0,
            clipPath: "inset(100% 0% 0% 0%)",
            transform: "translateY(1.5rem)",
            duration: REVIEW_ROW_EXIT_DURATION,
            ease: "none",
          },
          REVIEW_SECOND_ROW_EXIT_START,
        )
        .set(
          reviews,
          { autoAlpha: 0, pointerEvents: "none" },
          REVIEW_EXIT_END,
        )
        .set(
          contact,
          {
            autoAlpha: 1,
            clipPath: "inset(0% 0% 0% 0%)",
            pointerEvents: "auto",
            transform: "translateY(0rem)",
          },
          CONTACT_REVEAL_START,
        )
        .to(
          contactPhone,
          {
            autoAlpha: 1,
            transform: "translate3d(0, 0, 0)",
            duration: CONTACT_ITEM_DURATION,
            ease: "none",
          },
          contactPhoneStart,
        )
        .to(
          contactHours,
          {
            autoAlpha: 1,
            transform: "translate3d(0, 0, 0)",
            duration: CONTACT_ITEM_DURATION,
            ease: "none",
          },
          contactHoursStart,
        )
        .to(
          contactAddress,
          {
            autoAlpha: 1,
            transform: "translate3d(0, 0, 0)",
            duration: CONTACT_ITEM_DURATION,
            ease: "none",
          },
          contactAddressStart,
        )
        .to(
          contactMap,
          {
            autoAlpha: 1,
            transform: "translate3d(0, 0, 0)",
            duration: contactMapDuration,
            ease: "none",
          },
          contactMapStart,
        );

      return () => {
        window.cancelAnimationFrame(titleRevealFrame);
        window.cancelAnimationFrame(contactTitleRevealFrame);
        reviewsTitleStartedRef.current = false;
        contactTitleStartedRef.current = false;
        reviewsTitleRef.current?.reset();
        contactTitleRef.current?.reset();
        updateContactPhase(false);
        updateReviewMotionPhase(false);
        timeline.kill();
      };
    },
    {
      scope: sectionRef,
      dependencies: [reduceMotion, desktopContactMapMotion],
      revertOnUpdate: true,
    },
  );

  return (
    <section
      ref={sectionRef}
      id="reviews"
      className="drive-away-story"
      aria-labelledby="drive-away-reviews-title"
      data-video-ready={videoReady}
      data-video-failed={videoFailed}
      data-reduced-motion={reduceMotion}
    >
      <div className="drive-away-story__stage">
        <div className="drive-away-story__media" aria-hidden="true">
          <img
            className="drive-away-story__poster"
            src={reduceMotion || videoFailed ? VIDEO_EMPTY_POSTER : VIDEO_START_POSTER}
            width="1916"
            height="1080"
            loading="lazy"
            alt=""
          />
          {!reduceMotion && !videoFailed && (
            <div ref={mediaMountRef} className="drive-away-story__video" />
          )}
        </div>

        <div ref={reviewsRef} className="drive-away-reviews">
          <header ref={reviewsHeaderRef} className="drive-away-reviews__header">
            <div
              ref={reviewsHeadingCopyRef}
              className="drive-away-reviews__heading-copy"
            >
              <h2 id="drive-away-reviews-title">
                {reduceMotion ? (
                  "Отзывы наших клиентов. Работаем по делу."
                ) : (
                  <VerticalCutReveal
                    ref={reviewsTitleRef}
                    autoStart={false}
                    splitBy="words"
                    staggerDuration={0.075}
                    staggerFrom="first"
                    transition={{
                      type: "spring",
                      duration: 0.5,
                      bounce: 0.2,
                    }}
                    containerClassName="drive-away-reviews__title-reveal"
                  >
                    Отзывы наших клиентов. Работаем по делу.
                  </VerticalCutReveal>
                )}
              </h2>
            </div>
            {!reduceMotion && (
              <button
                ref={motionToggleRef}
                className="drive-away-reviews__motion-toggle"
                type="button"
                aria-label={marqueePaused ? "Продолжить движение отзывов" : "Остановить движение отзывов"}
                aria-pressed={marqueePaused}
                onClick={() => setMarqueePaused((paused) => !paused)}
              >
                {marqueePaused ? (
                  <Play aria-hidden="true" size={17} fill="currentColor" />
                ) : (
                  <Pause aria-hidden="true" size={17} fill="currentColor" />
                )}
              </button>
            )}
          </header>
          {reduceMotion ? (
            <StaticReviews />
          ) : (
            <MovingReviews
              active={reviewMotionActive && !marqueePaused}
              firstRowRef={firstReviewRowRef}
              secondRowRef={secondReviewRowRef}
            />
          )}
        </div>

        <div ref={contactRef} className="drive-away-contact">
          <ContactSection
            embedded
            active={reduceMotion || contactActive}
            headingRevealRef={contactTitleRef}
          />
        </div>
      </div>
    </section>
  );
}
