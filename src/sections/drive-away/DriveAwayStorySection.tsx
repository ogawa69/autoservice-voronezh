import { useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { reviewExamples } from "@/content/demo";
import { DriveAwayMedia } from "./components/DriveAwayMedia/DriveAwayMedia";
import { ReviewsScene } from "./components/ReviewsScene/ReviewsScene";
import { ContactScene } from "./components/ContactScene/ContactScene";
import { useDesktopContactMapMotion } from "./hooks/useDesktopContactMapMotion";
import { useDriveAwayTimeline } from "./hooks/useDriveAwayTimeline";
import { useDriveAwayVideo } from "./hooks/useDriveAwayVideo";
import type {
  DriveAwayStorySectionProps,
  RevealController,
} from "./types";
import "./DriveAwayStorySection.css";

export function DriveAwayStorySection({
  reviews = reviewExamples,
}: DriveAwayStorySectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const mediaMountRef = useRef<HTMLDivElement | null>(null);
  const reviewsRef = useRef<HTMLDivElement | null>(null);
  const reviewsHeaderRef = useRef<HTMLElement | null>(null);
  const reviewsHeadingCopyRef = useRef<HTMLDivElement | null>(null);
  const reviewsTitleRef = useRef<RevealController | null>(null);
  const firstReviewRowRef = useRef<HTMLDivElement | null>(null);
  const secondReviewRowRef = useRef<HTMLDivElement | null>(null);
  const motionToggleRef = useRef<HTMLButtonElement | null>(null);
  const contactRef = useRef<HTMLDivElement | null>(null);
  const contactHeadingRef = useRef<HTMLDivElement | null>(null);
  const contactPhoneRef = useRef<HTMLDivElement | null>(null);
  const contactHoursRef = useRef<HTMLDivElement | null>(null);
  const contactAddressRef = useRef<HTMLDivElement | null>(null);
  const contactMapRef = useRef<HTMLDivElement | null>(null);
  const contactTitleRef = useRef<RevealController | null>(null);
  const storyProgressRef = useRef(0);
  const reduceMotion = Boolean(useReducedMotion());
  const desktopContactMapMotion = useDesktopContactMapMotion();
  const [marqueePaused, setMarqueePaused] = useState(false);
  const { videoReady, videoFailed, controllerRef: videoControllerRef } =
    useDriveAwayVideo({ mediaMountRef, reduceMotion, storyProgressRef });
  const { contactActive, reviewMotionActive } = useDriveAwayTimeline({
    sectionRef,
    reviewsRef,
    reviewsHeaderRef,
    reviewsHeadingCopyRef,
    reviewsTitleRef,
    firstReviewRowRef,
    secondReviewRowRef,
    motionToggleRef,
    contactRef,
    contactHeadingRef,
    contactPhoneRef,
    contactHoursRef,
    contactAddressRef,
    contactMapRef,
    contactTitleRef,
    storyProgressRef,
    videoControllerRef,
    reduceMotion,
    desktopContactMapMotion,
  });

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
        <DriveAwayMedia
          mediaMountRef={mediaMountRef}
          reduceMotion={reduceMotion}
          videoFailed={videoFailed}
        />
        <ReviewsScene
          reviews={reviews}
          reduceMotion={reduceMotion}
          motionActive={reviewMotionActive}
          marqueePaused={marqueePaused}
          onToggleMarquee={() => setMarqueePaused((paused) => !paused)}
          sceneRef={reviewsRef}
          headerRef={reviewsHeaderRef}
          headingCopyRef={reviewsHeadingCopyRef}
          titleRef={reviewsTitleRef}
          firstRowRef={firstReviewRowRef}
          secondRowRef={secondReviewRowRef}
          motionToggleRef={motionToggleRef}
        />
        <div ref={contactRef} className="drive-away-contact">
          <ContactScene
            embedded
            active={reduceMotion || contactActive}
            frameRef={contactRef}
            headingRevealRef={contactTitleRef}
            headingRef={contactHeadingRef}
            phoneRef={contactPhoneRef}
            hoursRef={contactHoursRef}
            addressRef={contactAddressRef}
            mapRevealRef={contactMapRef}
          />
        </div>
      </div>
    </section>
  );
}
